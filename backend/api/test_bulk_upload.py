from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from django.core.files.uploadedfile import SimpleUploadedFile
import openpyxl
import io
from decimal import Decimal
from api.models import Product, Category
from api.test_manager_products import make_user

class BulkProductUploadTest(APITestCase):
    def setUp(self):
        self.manager = make_user("mgr_bulk", "manager")
        self.customer = make_user("cust_bulk", "customer")
        self.url = reverse("manager-products-bulk-upload")

    def test_customer_cannot_bulk_upload(self):
        self.client.force_authenticate(user=self.customer)
        csv_content = b"name,price,description,type,concern,image_url,stock\nProduct A,12.99,Desc A,Skin,Concern A,http://example.com/a.jpg,50"
        file_obj = SimpleUploadedFile("products.csv", csv_content, content_type="text/csv")
        res = self.client.post(self.url, {"file": file_obj}, format="multipart")
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_unauthenticated_cannot_bulk_upload(self):
        csv_content = b"name,price,description,type,concern,image_url,stock\nProduct A,12.99,Desc A,Skin,Concern A,http://example.com/a.jpg,50"
        file_obj = SimpleUploadedFile("products.csv", csv_content, content_type="text/csv")
        res = self.client.post(self.url, {"file": file_obj}, format="multipart")
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_manager_can_bulk_upload_csv(self):
        self.client.force_authenticate(user=self.manager)
        csv_content = (
            b"name,price,description,type,concern,image_url,stock\n"
            b"CSV Product 1,19.99,Description 1,Skin,Hydration,http://example.com/1.jpg,50\n"
            b"CSV Product 2,29.99,Description 2,Body,Dryness,,100\n"
        )
        file_obj = SimpleUploadedFile("products.csv", csv_content, content_type="text/csv")
        res = self.client.post(self.url, {"file": file_obj}, format="multipart")
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data["status"], "success")
        self.assertEqual(len(res.data["imported"]), 2)

        # Verify items in DB
        prod1 = Product.objects.get(name="CSV Product 1")
        self.assertEqual(prod1.price, Decimal('19.99'))
        self.assertEqual(prod1.stock, 50)
        self.assertEqual(prod1.image, "http://example.com/1.jpg")
        self.assertEqual(prod1.category.name, "Skin")

        prod2 = Product.objects.get(name="CSV Product 2")
        self.assertEqual(prod2.price, Decimal('29.99'))
        self.assertEqual(prod2.stock, 100)
        self.assertEqual(prod2.image, "")
        self.assertEqual(prod2.category.name, "Body")

    def test_manager_can_bulk_upload_xlsx(self):
        self.client.force_authenticate(user=self.manager)
        wb = openpyxl.Workbook()
        ws = wb.active
        ws.append(["name", "price", "description", "type", "concern", "image_url", "stock"])
        ws.append(["XLSX Product 1", "39.99", "Description X", "Face", "Acne", "http://example.com/x.jpg", "20"])
        ws.append(["XLSX Product 2", "49.99", "Description Y", "Skin", "Anti-aging", "", "0"])

        buffer = io.BytesIO()
        wb.save(buffer)
        buffer.seek(0)

        file_obj = SimpleUploadedFile("products.xlsx", buffer.read(), content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
        res = self.client.post(self.url, {"file": file_obj}, format="multipart")
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data["status"], "success")

        # Verify items in DB
        prod1 = Product.objects.get(name="XLSX Product 1")
        self.assertEqual(prod1.price, Decimal('39.99'))
        self.assertEqual(prod1.stock, 20)
        self.assertEqual(prod1.category.name, "Face")

        prod2 = Product.objects.get(name="XLSX Product 2")
        self.assertEqual(prod2.price, Decimal('49.99'))
        self.assertEqual(prod2.stock, 0)
        self.assertEqual(prod2.category.name, "Skin")

    def test_bulk_upload_transactional_rollback(self):
        self.client.force_authenticate(user=self.manager)
        # The second row has an invalid negative price, which should cause validation error and rollback the first row creation.
        csv_content = (
            b"name,price,description,type,concern,image_url,stock\n"
            b"Valid Product,19.99,Desc,Skin,Concern,http://example.com/valid.jpg,50\n"
            b"Invalid Product,-5.00,Desc,Skin,Concern,,10\n"
        )
        file_obj = SimpleUploadedFile("products.csv", csv_content, content_type="text/csv")
        res = self.client.post(self.url, {"file": file_obj}, format="multipart")
        
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(res.data["status"], "error")
        self.assertIn("errors", res.data)
        self.assertEqual(len(res.data["errors"]), 1)
        self.assertEqual(res.data["errors"][0]["row"], 3) # Row index starts at 2 (headers is row 1, valid product is row 2, invalid product is row 3)

        # Assert no products were actually created (transactional rollback)
        self.assertFalse(Product.objects.filter(name="Valid Product").exists())
        self.assertFalse(Product.objects.filter(name="Invalid Product").exists())

    def test_bulk_upload_duplicate_id_rollback(self):
        self.client.force_authenticate(user=self.manager)
        # Create an existing product
        existing = Product.objects.create(
            id="existing-product",
            slug="existing-product",
            name="Existing Product",
            price=Decimal('10.00'),
            category=Category.objects.get_or_create(name="Skin", slug="skin")[0],
            stock=5
        )

        # Row 2 is valid. Row 3 tries to create product with slug "existing-prod" which exists.
        csv_content = (
            b"name,price,description,type,concern,image_url,stock\n"
            b"New Valid Product,19.99,Desc,Skin,Concern,,50\n"
            b"Existing Product,29.99,Desc,Skin,Concern,,100\n"
        )
        file_obj = SimpleUploadedFile("products.csv", csv_content, content_type="text/csv")
        res = self.client.post(self.url, {"file": file_obj}, format="multipart")
        
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(Product.objects.filter(name="New Valid Product").exists())

    def test_bulk_upload_empty_file(self):
        self.client.force_authenticate(user=self.manager)
        csv_content = b""
        file_obj = SimpleUploadedFile("products.csv", csv_content, content_type="text/csv")
        res = self.client.post(self.url, {"file": file_obj}, format="multipart")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_bulk_upload_invalid_file_format(self):
        self.client.force_authenticate(user=self.manager)
        file_obj = SimpleUploadedFile("products.txt", b"some text", content_type="text/plain")
        res = self.client.post(self.url, {"file": file_obj}, format="multipart")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

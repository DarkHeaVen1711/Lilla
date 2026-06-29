from django.core import mail
from django.test import TestCase, override_settings
from django.contrib.auth.models import User

@override_settings(EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend")
class OTPEmailTest(TestCase):
    def test_otp_email_sent_with_html_and_text_parts(self):
        from api.views import send_otp_for_user
        user = User.objects.create_user(username="otpmail", email="otpmail@example.com", password="x")

        send_otp_for_user(user, channel="email")

        self.assertEqual(len(mail.outbox), 1)
        sent = mail.outbox[0]
        self.assertEqual(sent.to, ["otpmail@example.com"])
        self.assertTrue(len(sent.alternatives) > 0)
        self.assertIn("verification code", sent.subject.lower())

    def test_otp_code_is_six_digits(self):
        from api.views import generate_otp_code
        code = generate_otp_code()
        self.assertEqual(len(code), 6)
        self.assertTrue(code.isdigit())

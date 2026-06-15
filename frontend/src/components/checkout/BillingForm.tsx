import { CheckCircle2, ChevronDown } from "lucide-react";

export function BillingForm() {
  return (
    <div className="w-full bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
      <h2 className="font-serif text-3xl mb-6">Billing Address</h2>
      
      <form className="space-y-4 font-sans text-gray-800">
        <div className="grid grid-cols-2 gap-4">
          <input 
            type="text" 
            placeholder="First Name" 
            className="w-full h-[56px] px-4 rounded-xl border border-gray-300 focus:outline-none focus:border-black transition-colors"
          />
          <input 
            type="text" 
            placeholder="Last Name" 
            className="w-full h-[56px] px-4 rounded-xl border border-gray-300 focus:outline-none focus:border-black transition-colors"
          />
        </div>

        <div className="relative">
          <input 
            type="email" 
            placeholder="Email Address" 
            className="w-full h-[56px] px-4 rounded-xl border border-gray-300 focus:outline-none focus:border-black transition-colors pr-12"
          />
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-blue-500">
            <CheckCircle2 className="w-5 h-5 fill-current text-white" strokeWidth={1.5} />
          </div>
        </div>

        <div className="relative">
          <select defaultValue="" className="w-full h-[56px] px-4 rounded-xl border border-gray-300 focus:outline-none focus:border-black transition-colors appearance-none bg-transparent">
            <option value="" disabled>Country / Region</option>
            <option value="US">United States</option>
            <option value="UK">United Kingdom</option>
            <option value="CA">Canada</option>
            <option value="AU">Australia</option>
          </select>
          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
            <ChevronDown className="w-5 h-5" />
          </div>
        </div>

        <input 
          type="text" 
          placeholder="Address" 
          className="w-full h-[56px] px-4 rounded-xl border border-gray-300 focus:outline-none focus:border-black transition-colors"
        />

        <div className="grid grid-cols-2 gap-4">
          <div className="relative">
            <select defaultValue="" className="w-full h-[56px] px-4 rounded-xl border border-gray-300 focus:outline-none focus:border-black transition-colors appearance-none bg-transparent">
              <option value="" disabled>State/Province</option>
              <option value="NY">New York</option>
              <option value="CA">California</option>
              <option value="TX">Texas</option>
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
              <ChevronDown className="w-5 h-5" />
            </div>
          </div>
          <input 
            type="text" 
            placeholder="City" 
            className="w-full h-[56px] px-4 rounded-xl border border-gray-300 focus:outline-none focus:border-black transition-colors"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <input 
            type="text" 
            placeholder="Zip/Postal Code" 
            className="w-full h-[56px] px-4 rounded-xl border border-gray-300 focus:outline-none focus:border-black transition-colors"
          />
          <input 
            type="tel" 
            placeholder="Phone" 
            className="w-full h-[56px] px-4 rounded-xl border border-gray-300 focus:outline-none focus:border-black transition-colors"
          />
        </div>

        <div className="flex items-center space-x-3 pt-4">
          <input 
            type="checkbox" 
            id="same-address" 
            className="w-5 h-5 rounded border-gray-300 text-black focus:ring-black accent-black"
          />
          <label htmlFor="same-address" className="text-gray-700 select-none">
            My billing and shipping address are the same
          </label>
        </div>
      </form>
    </div>
  );
}

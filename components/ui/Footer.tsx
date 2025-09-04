import Link from "next/link";
const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-800 text-white py-8">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <h3 className="text-xl font-bold">Bingo Platform</h3>
            <p className="text-sm">Play and win real money</p>
          </div>
          

      <div className="flex space-x-4">
        <Link href="/termsofservice" className="hover:text-blue-300">
          Terms of Service
        </Link>
        <Link href="/privacypolicy" className="hover:text-blue-300">
          Privacy Policy
        </Link>
        <Link href="/contact-us" className="hover:text-blue-300">
          Contact
        </Link>
      </div>

        </div>
        <div className="mt-8 text-center text-sm">
          <p>&copy; {new Date().getFullYear()} Bingo Platform. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
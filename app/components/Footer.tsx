export default function Footer() {
  return (
    <footer className="bg-background border-t border-gray-200 mt-12">
      <div className="max-w-7xl mx-auto py-6 px-4 flex flex-col sm:flex-row justify-between items-center text-textSecondary text-sm">
        <p>© 2026 NatureWorld. Wszelkie prawa zastrzeżone.</p>
        <div className="flex space-x-4 mt-2 sm:mt-0">
          <a href="/contact" className="hover:text-primary">
            Kontakt
          </a>
          <a href="/terms" className="hover:text-primary">
            Regulamin
          </a>
          <a href="/privacy" className="hover:text-primary">
            Prywatność
          </a>
        </div>
      </div>
    </footer>
  );
}

export default function Categories() {
  const categories = [
    {
      name: "Psy",
      subcategories: [
        "Karma",
        "Zabawki",
        "Legowiska",
        "Akcesoria",
        "Higiena",
        "Ubrania",
      ],
    },
    {
      name: "Koty",
      subcategories: [
        "Karma",
        "Zabawki",
        "Drapaki",
        "Legowiska",
        "Transport",
        "Akcesoria",
      ],
    },
    {
      name: "Akwarystyka",
      subcategories: [
        "Akwaria",
        "Filtry",
        "Rośliny",
        "Ryby",
        "Dekoracje",
        "Oświetlenie",
      ],
    },
    {
      name: "Ptaki",
      subcategories: ["Klatki", "Karma", "Zabawki", "Legowiska", "Akcesoria"],
    },
    {
      name: "Karmy",
      subcategories: [
        "Dla psów",
        "Dla kotów",
        "Dla ptaków",
        "Dla gryzoni",
        "Dla ryb",
      ],
    },
    {
      name: "Promocje",
      subcategories: ["Wyprzedaże", "Nowości", "Bestsellery", "Okazje dnia"],
    },
  ];

  return (
    <nav className="bg-primary shadow relative z-50">
      <ul className="flex justify-between max-w-7xl mx-auto p-2">
        {categories.map((cat) => (
          <li key={cat.name} className="group">
            {/* Kategoria główna */}
            <div className="px-4 py-2 font-bold text-white cursor-pointer hover:bg-green-800 rounded">
              {cat.name}
            </div>

            {/* Mega menu - pełna szerokość od lewej do prawej */}
            <div className="absolute top-full left-0 w-screen bg-white shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-10">
              <div className="max-w-7xl mx-auto grid grid-cols-4 gap-6 p-6">
                {cat.subcategories.map((sub) => (
                  <div
                    key={sub}
                    className="hover:underline p-2 rounded cursor-pointer"
                  >
                    {sub}
                  </div>
                ))}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </nav>
  );
}

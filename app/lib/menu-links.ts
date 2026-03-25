export type MenuLink = {
  label: string;
  href: string;
  highlight?: boolean;
};

export const extraMenuLinks: MenuLink[] = [
  {
    label: "Promocje",
    href: "/promocje",
    highlight: true,
  },
  {
    label: "Aktualności",
    href: "/aktualnosci",
  },
];

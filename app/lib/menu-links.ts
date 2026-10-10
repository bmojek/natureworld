export type MenuLink = {
  label: string;
  href: string;
  highlight?: boolean;
};

export const extraMenuLinks: MenuLink[] = [
  {
    label: "Aktualności",
    href: "/aktualnosci",
  },
];

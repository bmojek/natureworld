export {
  categoryHasAvailableProducts,
  categoryHasMenuProducts,
  categoryHasConfirmedAvailableProducts,
  getConfirmedCategoryChildren,
  getMenuCategoryChildren,
  sortMenuGroupsByChildren,
  markConfirmedProductCategories,
  categoryHasCatalogIds,
  findCategoryBySlugPath,
  getDepartmentBySlug,
  resolveStorefrontDepartments,
  storefrontDepartmentConfig,
} from "./storefront-department-core";
export type { DepartmentCategoryNode, StorefrontDepartment } from "./storefront-department-core";

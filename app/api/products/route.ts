import { NextRequest, NextResponse } from "next/server";
import { BaseLinkerError } from "@/app/lib/base-linker";
import { getBaseCategories, getBaseProductsPage } from "@/app/lib/base-store";
import { parseCatalogQuery } from "@/app/lib/catalog-query-core";
import { buildCategoryTree } from "@/app/lib/categories";
import { collectCategoryIds, findCategoryBySlugPath } from "@/app/lib/category-utils";
import { resolveStorefrontDepartments } from "@/app/lib/storefront-categories";
import { withBaseLinkerRequestContext } from "@/app/lib/base-linker-diagnostics";

async function handleProductsGet(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    let categoryIds = searchParams.get("categoryIds")?.split(",").filter(Boolean) ?? [];
    const departmentSlug = searchParams.get("department");
    const categoryPath = searchParams.get("categoryPath");
    if (departmentSlug && categoryPath) {
      return NextResponse.json({ products: [], cursor: null, totalCount: 0, error: "INVALID_CATEGORY_SCOPE" }, { status: 400, headers: { "Cache-Control": "no-store" } });
    }
    if (categoryIds.length > 1000 || categoryIds.some((id) => !/^\d+$/.test(id))) {
      return NextResponse.json({ products: [], cursor: null, totalCount: 0, error: "INVALID_CATEGORY_IDS" }, { status: 400, headers: { "Cache-Control": "no-store" } });
    }
    const selectedCategoryIds = searchParams.get("categories")?.split(",").filter(Boolean) ?? [];
    if (selectedCategoryIds.length > 50 || selectedCategoryIds.some((id) => !/^\d+$/.test(id))) {
      return NextResponse.json({ products: [], cursor: null, totalCount: 0, error: "INVALID_CATEGORY_FILTER" }, { status: 400, headers: { "Cache-Control": "no-store" } });
    }
    const search = searchParams.get("search") ?? undefined;
    const suggestions = searchParams.get("suggestions");
    if (suggestions !== null && suggestions !== "1") {
      return NextResponse.json({ products: [], cursor: null, totalCount: 0, error: "INVALID_SUGGESTIONS_MODE" }, { status: 400, headers: { "Cache-Control": "no-store" } });
    }
    const rawPreviewLimit = searchParams.get("previewLimit");
    const previewLimit = rawPreviewLimit === null ? 6 : Number(rawPreviewLimit);
    if (rawPreviewLimit !== null && (suggestions !== "1" || !/^\d{1,2}$/.test(rawPreviewLimit) || !Number.isInteger(previewLimit) || previewLimit < 1 || previewLimit > 24)) {
      return NextResponse.json({ products: [], cursor: null, totalCount: 0, error: "INVALID_PREVIEW_LIMIT" }, { status: 400, headers: { "Cache-Control": "no-store" } });
    }
    if (search && search.length > 200) {
      return NextResponse.json({ products: [], cursor: null, totalCount: 0, error: "INVALID_SEARCH" }, { status: 400, headers: { "Cache-Control": "no-store" } });
    }
    const query = parseCatalogQuery(searchParams);
    if (!query) {
      return NextResponse.json({ products: [], cursor: null, totalCount: 0, error: "INVALID_CATALOG_FILTER" }, { status: 400, headers: { "Cache-Control": "no-store" } });
    }
    const rawCursor = searchParams.get("cursor");
    const requestedPage = rawCursor === null ? 1 : Number(rawCursor);
    if (rawCursor !== null && (!/^\d+$/.test(rawCursor) || !Number.isSafeInteger(requestedPage) || requestedPage < 1)) {
      return NextResponse.json(
        { products: [], cursor: null, totalCount: 0, error: "INVALID_PRODUCT_CURSOR" },
        { status: 400, headers: { "Cache-Control": "no-store" } },
      );
    }
    if (departmentSlug || categoryPath) {
      if (departmentSlug && !/^[a-z-]{1,40}$/.test(departmentSlug)) return NextResponse.json({ products: [], cursor: null, totalCount: 0, error: "INVALID_DEPARTMENT" }, { status: 400, headers: { "Cache-Control": "no-store" } });
      if (categoryPath && (categoryPath.length > 400 || !/^[a-z0-9-]+(?:\/[a-z0-9-]+){0,11}$/.test(categoryPath))) return NextResponse.json({ products: [], cursor: null, totalCount: 0, error: "INVALID_CATEGORY_PATH" }, { status: 400, headers: { "Cache-Control": "no-store" } });
      const tree = buildCategoryTree(await getBaseCategories());
      if (departmentSlug) {
        const department = resolveStorefrontDepartments(tree).find((item) => item.slug === departmentSlug);
        if (!department) return NextResponse.json({ products: [], cursor: null, totalCount: 0, error: "UNKNOWN_DEPARTMENT" }, { status: 404, headers: { "Cache-Control": "no-store" } });
        categoryIds = department.categoryIds;
      } else if (categoryPath) {
        const category = findCategoryBySlugPath(tree, categoryPath.split("/"));
        if (!category) return NextResponse.json({ products: [], cursor: null, totalCount: 0, error: "UNKNOWN_CATEGORY_PATH" }, { status: 404, headers: { "Cache-Control": "no-store" } });
        categoryIds = collectCategoryIds(category);
      }
      if (categoryIds.length === 0) return NextResponse.json({ products: [], cursor: null, totalCount: 0 }, { headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60" } });
    }
    const page = requestedPage;
    const data = await getBaseProductsPage({ categoryIds, selectedCategoryIds, search, query, page, pageSize: suggestions === "1" ? previewLimit : undefined, preview: suggestions === "1" });

    return NextResponse.json(data, {
      headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60" },
    });
  } catch (error) {
    const notConfigured =
      error instanceof BaseLinkerError && error.code === "NOT_CONFIGURED";

    return NextResponse.json(
      {
        products: [],
        cursor: null,
        totalCount: 0,
        error: notConfigured
          ? "BASE_LINKER_NOT_CONFIGURED"
          : "BASE_LINKER_REQUEST_FAILED",
      },
      { status: notConfigured ? 503 : 502, headers: { "Cache-Control": "no-store" } },
    );
  }
}

export function GET(request: NextRequest) {
  const url = new URL(request.url);
  const operation = url.searchParams.has("search")
    ? "catalog-search"
    : url.searchParams.get("suggestions") === "1"
      ? "catalog-preview"
      : "catalog-page";
  return withBaseLinkerRequestContext(
    { path: url.pathname, operation },
    () => handleProductsGet(request),
  );
}

import { json } from "@remix-run/node";
import { Link, Outlet, useLoaderData, useRouteError } from "@remix-run/react";
import { boundary } from "@shopify/shopify-app-remix/server";
import { AppProvider } from "@shopify/shopify-app-remix/react";
import { NavMenu } from "@shopify/app-bridge-react";
import polarisStyles from "@shopify/polaris/build/esm/styles.css?url";
import { authenticate } from "../shopify.server";
import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid'; // Import UUID generator

const prisma = new PrismaClient();
const arr = []; // Ensure arr is defined here

export const links = () => [{ rel: "stylesheet", href: polarisStyles }];

export const loader = async ({ request }) => {
  await authenticate.admin(request);

  const accessToken = await fetchAccessToken(); // Fetch access token here
  if (!accessToken) {
    throw new Response("Access token missing", { status: 400 });
  }

  const shopifyDomain = "testing-wishlist-inject.myshopify.com"; // Replace with your store details

  try {
    const response = await fetch(`https://${shopifyDomain}/admin/api/2023-04/products.json`, {
      method: "GET",
      headers: {
        "X-Shopify-Access-Token": accessToken,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch products: ${response.statusText}`);
    }

    const data = await response.json();

    // Insert products into the database
    await Promise.all(data.products.map(insertProductToDB));
    await Promise.all(data.products.map(insertGroupProductsToDB));

    return json(data.products);
  } catch (error) {
    console.error("Error fetching products:", error);
    throw new Response("Failed to fetch products", { status: 500 });
  }
};

async function fetchAccessToken() {
  const sessions = await prisma.session.findMany({
    select: {
      accessToken: true, // Only fetch the accessToken field
    }
  });
  if (sessions.length > 0) {
    arr.push(sessions[0].accessToken);
    return arr[0];
  }
  return null;
}

async function insertProductToDB(productData) {
  try {
    const newProduct = await prisma.products.upsert({
      where: { store_id: productData.id.toString() }, // Use Shopify product ID as the unique identifier
      update: {
        featuredImage: productData.image?.src || null,
        handle: productData.handle,
        status: productData.status,
        title: productData.title,
      },
      create: {
        id: uuidv4(), // Generate a new UUID for the product ID
        featuredImage: productData.image?.src || null,
        handle: productData.handle,
        status: productData.status,
        title: productData.title,
        store_id: productData.id.toString(), // Use the Shopify product ID for store_id
      }
    });

    console.log("Product inserted/updated successfully:", newProduct);
  } catch (error) {
    console.error("Error inserting product:", error);
  }
}

async function insertGroupProductsToDB(productData) {
  try {
    const groupProductsPromises = productData.variants.map(async (variant) => {
      return await prisma.GroupProducts.upsert({
        where: { id: variant.id.toString() }, // Using variant ID as unique identifier
        update: {
          group_id: uuidv4(), // Replace with actual group ID logic
          product_sku: variant.sku || "No SKU", // SKU from the variant
          product_name: productData.title, // Title from product
          swatch_title: variant.option1 || "No Option", // Option1 for swatch title
          swatch_color: variant.option2 || "No Color", // Option2 for color
          swatch_image: productData.image?.src || null, // Product image
          sort_order: variant.position, // Variant position
        },
        create: {
          id: variant.id.toString(), // Generating new UUID for the primary key
          group_id: uuidv4(), // Replace with actual group ID logic
          product_sku: variant.sku || "No SKU",
          product_name: productData.title,
          swatch_title: variant.option1 || "No Option",
          swatch_color: variant.option2 || "No Color",
          swatch_image: productData.image?.src || null,
          sort_order: variant.position,
        }
      });
    });

    // Wait for all variants to be inserted/updated
    const results = await Promise.all(groupProductsPromises);
    console.log("Products inserted/updated successfully2:", results);
  } catch (error) {
    console.error("Error inserting group products:", error);
  }
}


// Shopify needs Remix to catch some thrown responses so that their headers are included in the response.
export function ErrorBoundary() {
  return boundary.error(useRouteError());
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};

export default function App() {
  const { apiKey } = useLoaderData();

  return (
    <AppProvider isEmbeddedApp apiKey={apiKey}>
      <NavMenu>
        <Link to="/app" rel="home">
          Home
        </Link>
        <Link to="/app/additional">Product page</Link>
        <Link to="/app/count">Count page</Link>
      </NavMenu>
      <Outlet />
    </AppProvider>
  );
}

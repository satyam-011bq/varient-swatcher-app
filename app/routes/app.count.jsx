// app/routes/productCount.jsx

import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import {arr} from "./app";

export const loader = async () => {
  const accessToken = arr[0]; // Ensure 'arr' is defined and contains access token
  const shopifyDomain = "testing-wishlist-inject.myshopify.com"; // Apni store ki details yahan daalein

  try {
    const response = await fetch(`https://${shopifyDomain}/admin/api/2023-04/products/count.json`, {
      method: "GET",
      headers: {
        "X-Shopify-Access-Token": accessToken,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Count fetch karne mein problem: ${response.statusText}`);
    }

    const data = await response.json();
    return json(data.count);
  } catch (error) {
    console.error("Count fetch karne mein error:", error);
    throw new Response("Count fetch karne mein error", { status: 500 });
  }
};

// Component to display product count
export default function ProductCountPage() {
  const productCount = useLoaderData(); // Load the product count

  return (
    <div>
      <h1>Total Products Count: {productCount}</h1> {/* Display the count */}
    </div>
  );
}

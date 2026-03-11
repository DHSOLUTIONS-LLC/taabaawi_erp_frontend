import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
// import type { UserOptions } from "jspdf-autotable";

// interface ExportProduct {
//   "Product Name": string;
//   SKU: string;
//   Barcode: string;
//   Category: string;
//   Branch: string;
//   Quantity: number;
//   "Cost Price (KWD)": number;
//   "Selling Price (KWD)": number;
//   Status: string;
//   Description: string;
//   "Created Date": string;
// }

export const exportToExcel = (
  products: any[],
  filename: string = "products",
) => {
  // Transform products to export format
  const exportData = products.map((product) => ({
    "Product Name": product.name || product.product_name || "",
    SKU: product.sku || "",
    Barcode: product.barcode || "",
    Category:
      product.category?.category_name ||
      product.category_name ||
      "Uncategorized",
    Branch: product.branch || product.branch_name || "Main Warehouse",
    Quantity: product.quantity || product.stock_quantity || 0,
    "Cost Price (KWD)": product.cost || product.cost_price || 0,
    "Selling Price (KWD)": product.price || product.selling_price || 0,
    Status: product.status || (product.is_active ? "In Stock" : "Out of Stock"),
    Description: product.description || "",
    "Created Date": product.created_at
      ? new Date(product.created_at).toLocaleDateString()
      : "",
  }));

  // Create worksheet
  const worksheet = XLSX.utils.json_to_sheet(exportData);

  // Create workbook
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Products");

  // Generate Excel file
  const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  const blob = new Blob([excelBuffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8",
  });

  // Save file
  saveAs(blob, `${filename}_${new Date().toISOString().split("T")[0]}.xlsx`);
};

export const exportToWord = (
  products: any[],
  filename: string = "products",
) => {
  // Create HTML content for Word
  const htmlContent = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" 
              xmlns:w="urn:schemas-microsoft-com:office:word" 
              xmlns="http://www.w3.org/TR/REC-html40">
        <head>
            <meta charset="UTF-8">
            <title>${filename}</title>
            <style>
                body { font-family: Arial, sans-serif; }
                table { border-collapse: collapse; width: 100%; margin: 20px 0; }
                th { background-color: #f2f2f2; text-align: left; padding: 8px; border: 1px solid #ddd; }
                td { padding: 8px; border: 1px solid #ddd; }
                h1 { color: #333; }
                .header { margin-bottom: 20px; }
                .date { color: #666; font-size: 14px; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>Product Inventory Report</h1>
                <div class="date">Generated: ${new Date().toLocaleDateString()}</div>
                <div>Total Products: ${products.length}</div>
            </div>
            <table>
                <thead>
                    <tr>
                        <th>Product Name</th>
                        <th>SKU</th>
                        <th>Category</th>
                        <th>Branch</th>
                        <th>Quantity</th>
                        <th>Cost Price (KWD)</th>
                        <th>Selling Price (KWD)</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    ${products
                      .map(
                        (product) => `
                        <tr>
                            <td>${product.name || product.product_name || ""}</td>
                            <td>${product.sku || ""}</td>
                            <td>${product.category?.category_name || product.category_name || "Uncategorized"}</td>
                            <td>${product.branch || product.branch_name || "Main Warehouse"}</td>
                            <td>${product.quantity || product.stock_quantity || 0}</td>
                            <td>${product.cost || product.cost_price || 0}</td>
                            <td>${product.price || product.selling_price || 0}</td>
                            <td>${product.status || (product.is_active ? "In Stock" : "Out of Stock")}</td>
                        </tr>
                    `,
                      )
                      .join("")}
                </tbody>
            </table>
        </body>
        </html>
    `;

  // Create blob
  const blob = new Blob(["\ufeff", htmlContent], {
    type: "application/msword",
  });

  // Save file
  saveAs(blob, `${filename}_${new Date().toISOString().split("T")[0]}.doc`);
};

export const exportToPDF = (products: any[], filename: string = "products") => {
  if (products.length === 0) {
    alert("No products to export");
    return;
  }

  try {
    // Create PDF in landscape mode
    const doc = new jsPDF("landscape", "mm", "a4");

    // Set margins
    const marginLeft = 10;
    const marginTop = 20;
    let yPos = marginTop;

    // Title
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("PRODUCT INVENTORY REPORT", 148.5, yPos, { align: "center" });
    yPos += 10;

    // Report details
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, marginLeft, yPos);
    doc.text(`Total Products: ${products.length}`, 250, yPos, {
      align: "right",
    });
    yPos += 8;

    // Draw line
    doc.setDrawColor(200, 200, 200);
    doc.line(marginLeft, yPos, 287, yPos);
    yPos += 10;

    // Define column widths
    const colWidths = [40, 30, 30, 30, 20, 25, 25, 25];
    const headers = [
      "Product Name",
      "SKU",
      "Category",
      "Branch",
      "Quantity",
      "Cost (KWD)",
      "Price (KWD)",
      "Status",
    ];

    // Draw table header
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255);
    doc.setFillColor(59, 130, 246); // Blue background

    let xPos = marginLeft;
    headers.forEach((header, index) => {
      doc.rect(xPos, yPos, colWidths[index], 8, "F");
      doc.text(header, xPos + 2, yPos + 5.5);
      xPos += colWidths[index];
    });

    yPos += 8;
    doc.setTextColor(0);
    doc.setFont("helvetica", "normal");

    // Draw table rows
    products.forEach((product, rowIndex) => {
      // Check if we need a new page
      if (yPos > 190) {
        doc.addPage("landscape");
        yPos = marginTop;

        // Draw header again on new page
        doc.setFont("helvetica", "bold");
        doc.setTextColor(255);
        doc.setFillColor(59, 130, 246);
        xPos = marginLeft;
        headers.forEach((header, index) => {
          doc.rect(xPos, yPos, colWidths[index], 8, "F");
          doc.text(header, xPos + 2, yPos + 5.5);
          xPos += colWidths[index];
        });
        yPos += 8;
        doc.setTextColor(0);
        doc.setFont("helvetica", "normal");
      }

      // Alternate row colors
      if (rowIndex % 2 === 0) {
        doc.setFillColor(248, 248, 248);
        xPos = marginLeft;
        colWidths.forEach((width) => {
          doc.rect(xPos, yPos, width, 8, "F");
          xPos += width;
        });
      }

      // Draw cell content
      xPos = marginLeft;
      const rowData = [
        product.name || product.product_name || "",
        product.sku || "",
        product.category?.category_name ||
          product.category_name ||
          "Uncategorized",
        product.branch || product.branch_name || "Main Warehouse",
        String(product.quantity || product.stock_quantity || 0),
        `KWD ${product.cost || product.cost_price || 0}`,
        `KWD ${product.price || product.selling_price || 0}`,
        product.status || (product.is_active ? "In Stock" : "Out of Stock"),
      ];

      doc.setFontSize(9);
      rowData.forEach((cell, index) => {
        // Trim text if too long
        let text = cell;
        const maxWidth = colWidths[index] - 4;

        // Simple text truncation
        while (doc.getTextWidth(text) > maxWidth && text.length > 3) {
          text = text.substring(0, text.length - 4) + "...";
        }

        const align =
          index === 4 || index === 5 || index === 6 ? "right" : "left";
        const xOffset = align === "right" ? colWidths[index] - 2 : 2;

        doc.text(text, xPos + xOffset, yPos + 5.5, { align });
        xPos += colWidths[index];
      });

      yPos += 8;
    });

    // Add page numbers
    const pageCount = doc.internal.pages.length;
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(`Page ${i} of ${pageCount}`, 148.5, 205, { align: "center" });
    }

    // Save PDF
    doc.save(`${filename}_${new Date().toISOString().split("T")[0]}.pdf`);
  } catch (error) {
    console.error("PDF export failed:", error);
    alert("Failed to export to PDF");
  }
};

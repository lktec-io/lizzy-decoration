=========================================================
PHASE 2
INVENTORY MANAGEMENT ENGINE
=========================================================

Inventory is the heart of this ERP.

Every module must depend on Inventory.

Sales

Purchases

Transfers

Returns

Reports

Dashboard

QR Codes

Labels

must always use Inventory as the single source of truth.

Never duplicate stock quantities.

=========================================================
MODULE 1
PRODUCT CATEGORIES
=========================================================

Create Product Category Management.

Fields:

Category Name

Category Code

Description

Status

Created Date

Features:

Create Category

Edit Category

Delete Category (Soft Delete)

Search

Pagination

Sorting

Filtering

Business Rules:

Category names must be unique.

Prevent deletion if products exist.

=========================================================
MODULE 2
BRANDS
=========================================================

Create Brand Management.

Fields:

Brand Name

Brand Code

Description

Country

Status

Business Rules:

Brand names must be unique.

Prevent deletion if products exist.

=========================================================
MODULE 3
PRODUCT MANAGEMENT
=========================================================

This module manages every product.

Required Fields:

Product Name

Product Code

QR Code

Category

Brand

Description

Buying Price

Selling Price

Minimum Stock

Current Stock

Branch

Status

Product Image

Barcode (future ready)

Created By

Created Date

Updated Date

=========================================================
PRODUCT IMAGES
=========================================================

Support:

Image Upload

Preview

Replace

Delete

Multiple Images (future ready)

Compress images before storage.

=========================================================
PRODUCT CODE
=========================================================

Generate automatically.

Examples:

SPR-2026-00001

SPR-2026-00002

DEC-2026-00001

Rules:

Never duplicate.

Never reuse deleted codes.

Generation logic must be reusable.

=========================================================
QR CODE
=========================================================

Automatically generate QR Code.

QR should contain:

Product ID

Product Code

Branch ID

Product Name

Selling Price

Generate:

PNG

SVG (future ready)

Allow:

Download

Print

Regenerate

=========================================================
LABEL PRINTING
=========================================================

Generate professional labels.

Include:

QR Code

Product Name

Product Code

Selling Price

Branch

Print:

Single Label

Bulk Labels

Sticker Paper Ready

=========================================================
INVENTORY
=========================================================

Every product belongs to Inventory.

Inventory contains:

Current Quantity

Reserved Quantity

Available Quantity

Minimum Stock

Maximum Stock (future ready)

Branch

Last Updated

Never manually edit stock.

Stock changes ONLY through inventory transactions.

=========================================================
STOCK MOVEMENTS
=========================================================

Every movement creates history.

Movement Types:

Purchase

Sale

Return

Transfer Out

Transfer In

Adjustment

Opening Balance

Manual Correction (Admin Only)

Movement History stores:

Product

Branch

Quantity

Previous Stock

New Stock

Movement Type

Reference Number

User

Timestamp

=========================================================
STOCK ADJUSTMENTS
=========================================================

Allow authorized users to adjust stock.

Adjustment Reasons:

Damaged

Expired

Lost

Correction

Initial Count

System Error

Every adjustment requires:

Reason

Description

Approval (optional)

Audit Log

=========================================================
LOW STOCK ALERTS
=========================================================

Generate alerts automatically.

When stock <= minimum stock

Display:

Dashboard

Notifications

Inventory Page

Reports

=========================================================
OUT OF STOCK
=========================================================

Detect automatically.

Prevent selling out-of-stock products.

Display warning clearly.

=========================================================
STOCK SEARCH
=========================================================

Search using:

Product Name

Product Code

QR Code

Category

Brand

Branch

Fast search is required.

=========================================================
FILTERS
=========================================================

Inventory filters:

Branch

Category

Brand

Low Stock

Out of Stock

Status

Price Range

Date Added

=========================================================
INVENTORY DASHBOARD
=========================================================

Display:

Total Products

Total Inventory Value

Available Stock

Low Stock

Out of Stock

Recently Added

Recently Updated

=========================================================
BULK OPERATIONS
=========================================================

Support:

Bulk Delete

Bulk Status Change

Bulk Label Printing

Bulk QR Generation

Bulk Export

Bulk Import (future ready)

=========================================================
IMPORT / EXPORT
=========================================================

Export:

Excel

CSV

PDF

Future Ready:

Import Products from Excel

=========================================================
BUSINESS RULES
=========================================================

Never allow:

Negative stock.

Duplicate product code.

Duplicate QR.

Buying price greater than selling price without confirmation.

Deleting products with transaction history.

Deleting categories containing products.

Deleting brands containing products.

=========================================================
VALIDATION
=========================================================

Validate:

Product Name

Category

Brand

Prices

Stock

Image

QR Code

Product Code

=========================================================
API REQUIREMENTS
=========================================================

Create RESTful APIs for:

Categories

Brands

Products

Inventory

Stock Movements

Adjustments

Labels

QR Codes

Support:

Pagination

Filtering

Sorting

Searching

=========================================================
PERMISSIONS
=========================================================

Super Admin

Full Access

Manager

Manage Products

View Inventory

Approve Adjustments

Store Keeper

Manage Inventory

Adjust Stock

Cashier

View Products

Cannot Edit Inventory

=========================================================
REPORTS
=========================================================

Inventory Reports include:

Current Stock

Low Stock

Out of Stock

Inventory Value

Stock Movement

Adjustment Report

Product Performance

=========================================================
RESPONSIVENESS
=========================================================

Inventory pages must work on:

Desktop

Laptop

Tablet

Mobile

Tables must scroll horizontally.

Cards reorganize automatically.

=========================================================
QUALITY CHECK
=========================================================

Before completing Inventory module verify:

Products work.

Categories work.

Brands work.

Inventory updates correctly.

QR generation works.

Label printing works.

Stock movements recorded.

Reports generated.

Permissions verified.

Build passes.

Lint passes.

TODO updated.

CHANGELOG updated.

=========================================================
END OF PART 5B
=========================================================
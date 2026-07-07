=========================================================
PHASE 3
SALES ENGINE (POS)
=========================================================

The POS module is the most frequently used module.

It must be:

Fast

Reliable

Responsive

Easy to use

Cashier Friendly

Error Resistant

The POS must feel like commercial retail software.

=========================================================
MODULE 1
CUSTOMER MANAGEMENT
=========================================================

Create Customer Management Module.

Fields:

Customer Code

First Name

Last Name

Business Name (Optional)

Phone Number

Alternative Phone

Email

Address

Region

District

TIN Number (Optional)

Customer Type

Status

Created Date

Features:

Create Customer

Edit Customer

View Customer

Deactivate Customer

Search Customer

Customer Purchase History

Customer Return History

Customer Statistics

=========================================================
CUSTOMER TYPES
=========================================================

Walk In Customer

Retail Customer

Wholesale Customer

VIP Customer

Business Customer

Future customer types must be supported.

=========================================================
MODULE 2
POINT OF SALE (POS)
=========================================================

Create a modern POS interface.

The POS must support:

Product Search

QR Code Scan

Barcode Ready Architecture

Shopping Cart

Quantity Adjustment

Discounts

Price Override (Permission Based)

Notes

Customer Selection

Mixed Payments

Receipt Printing

=========================================================
POS LAYOUT
=========================================================

Left Side:

Product Search

Product Categories

Product Grid

Product Cards

Right Side:

Shopping Cart

Customer

Discount

Totals

Payment Section

Receipt Preview

Checkout

=========================================================
PRODUCT SEARCH
=========================================================

Search by:

Product Name

Product Code

QR Code

Category

Brand

Search must be instant.

=========================================================
SHOPPING CART
=========================================================

Cart supports:

Add Product

Remove Product

Update Quantity

Update Price (Permission Based)

Apply Discount

Apply Notes

Clear Cart

Cart Totals

=========================================================
BUSINESS RULES
=========================================================

Prevent:

Negative Quantity

Selling Out of Stock Products

Invalid Discounts

Invalid Prices

Duplicate Payment Submission

=========================================================
DISCOUNT SYSTEM
=========================================================

Discount Types:

Percentage

Fixed Amount

Whole Cart Discount

Line Item Discount

Permissions Required:

Cashier

Limited Discount

Manager

Extended Discount

Super Admin

Full Discount Authority

=========================================================
PAYMENT METHODS
=========================================================

Cash

M-Pesa

Airtel Money

Mixed Payment

Future Ready:

Bank Transfer

Card Payment

=========================================================
MIXED PAYMENT
=========================================================

Support combinations:

Cash + M-Pesa

Cash + Airtel Money

Cash + Multiple Methods

System must verify:

Total Paid >= Sale Total

=========================================================
CHECKOUT PROCESS
=========================================================

Process:

Validate Cart

Validate Stock

Validate Customer

Validate Payment

Create Sale

Create Sale Items

Create Payment Records

Update Inventory

Create Inventory Movements

Generate Receipt

Create Audit Logs

Create Activity Logs

Send Notifications

=========================================================
DATABASE TRANSACTION RULE
=========================================================

Sale processing MUST use MySQL transaction.

If any step fails:

Rollback Everything.

Never allow partial sales.

=========================================================
SALES NUMBER
=========================================================

Generate automatic sales numbers.

Examples:

SAL-2026-000001

SAL-2026-000002

SAL-2026-000003

Must be unique.

=========================================================
RECEIPT GENERATION
=========================================================

Generate receipt automatically.

Receipt includes:

Company Logo

Company Name

Branch

Receipt Number

Date

Cashier

Customer

Items

Quantity

Price

Discount

Subtotal

Total

Payment Method

Amount Paid

Balance

Footer Message

=========================================================
RECEIPT FEATURES
=========================================================

Preview Receipt

Print Receipt

Download PDF

Reprint Receipt

Email Receipt (Future Ready)

=========================================================
SALE HISTORY
=========================================================

Display:

Sale Number

Customer

Cashier

Branch

Date

Amount

Discount

Status

Payment Method

Actions

=========================================================
SALE DETAILS
=========================================================

View:

All Items

Payments

Discounts

Customer

Inventory Movements

Activity Logs

Audit Logs

=========================================================
MODULE 3
SALES RETURNS
=========================================================

Create complete returns management.

Fields:

Return Number

Original Sale

Customer

Return Date

Reason

Status

Approved By

=========================================================
RETURN REASONS
=========================================================

Damaged Product

Wrong Product Issued

Customer Changed Mind

Expired Product

Other

=========================================================
RETURN WORKFLOW
=========================================================

Locate Original Sale

Select Items

Select Quantity

Enter Reason

Validate Return

Approve Return

Restore Inventory

Generate Return Record

Generate Audit Log

=========================================================
RETURN BUSINESS RULES
=========================================================

Cannot return more than sold quantity.

Cannot return deleted sales.

Cannot return invalid products.

Inventory must update automatically.

=========================================================
RETURN NUMBER
=========================================================

Generate:

RET-2026-000001

RET-2026-000002

Must be unique.

=========================================================
REFUND MANAGEMENT
=========================================================

Track:

Refund Amount

Refund Method

Refund Date

Refund Status

Approved By

=========================================================
MODULE 4
SALES DASHBOARD
=========================================================

Display:

Today's Sales

Weekly Sales

Monthly Sales

Annual Sales

Average Sale Value

Sales Count

Returns Count

Top Customers

Top Products

Top Cashiers

=========================================================
SALES REPORTS
=========================================================

Reports include:

Daily Sales

Weekly Sales

Monthly Sales

Annual Sales

Customer Sales

Product Sales

Cashier Sales

Branch Sales

Discount Report

Returns Report

Payment Method Report

=========================================================
FILTERS
=========================================================

Date Range

Branch

Cashier

Customer

Product

Category

Payment Method

Status

=========================================================
PERMISSIONS
=========================================================

Super Admin

Full Access

Manager

Sales Management

Returns Approval

Discount Authority

Cashier

Create Sales

View Own Sales

Store Keeper

View Sales Only

=========================================================
VALIDATION
=========================================================

Validate:

Customer

Stock

Discount

Payment

Product

Quantity

Prices

Return Quantity

=========================================================
QUALITY CHECK
=========================================================

Verify:

POS Works

Checkout Works

Inventory Updates

Receipt Printing Works

Returns Work

Refunds Work

Reports Work

Permissions Work

Transactions Work

Build Passes

Lint Passes

TODO Updated

CHANGELOG Updated

=========================================================
END OF PART 5C
=========================================================
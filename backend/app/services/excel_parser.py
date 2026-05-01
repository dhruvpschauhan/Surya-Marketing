"""
Excel file parsers for product_code_info and discount_data files.
Follows the exact column structures defined in the spec.
"""
import pandas as pd
from decimal import Decimal, InvalidOperation
from typing import Optional
from app.schemas.product import ProductBase, ProductUploadPreview
from app.schemas.discount import DiscountBase, DiscountUploadPreview


COMPANIES = ["Apollo", "Supreme", "Astral", "Ashirvad"]
CATEGORIES = ["Pipe", "Fitting", "Solvent"]
MATERIAL_TYPES = ["PVC", "CPVC"]


def infer_category(description: str) -> str:
    """Infer product category from description text."""
    desc_upper = description.upper() if description else ""
    if "PIPE" in desc_upper:
        return "Pipe"
    elif "SOLVENT" in desc_upper:
        return "Solvent"
    else:
        return "Fitting"


def safe_decimal(value) -> Optional[Decimal]:
    """Convert a value to Decimal safely, returning None for invalid values."""
    if pd.isna(value) or value is None or str(value).strip() == "":
        return None
    try:
        return Decimal(str(value).strip())
    except (InvalidOperation, ValueError):
        return None


def parse_product_code_info(file_path: str) -> ProductUploadPreview:
    """
    Parse product_code_info Excel file.

    Expected column layout:
        NO. | QUANTITY | DESCRIPTION | ITEM CODE |
        APOLLO MRP | [ignore] | SUPREME MRP | [ignore] |
        ASTRAL MRP | [ignore] | ASHIRVAD MRP | [ignore] | Type

    Strategy: Read with header=0, then find columns by matching keywords.
    """
    errors = []
    products = []

    try:
        # Read the Excel file — try to detect the header row
        df = pd.read_excel(file_path, header=None)

        # Find the header row by looking for "ITEM CODE" or "Item Code"
        header_row = None
        for idx, row in df.iterrows():
            row_values = [str(v).strip().upper() for v in row.values if pd.notna(v)]
            if any("ITEM CODE" in val or "ITEM  CODE" in val for val in row_values):
                header_row = idx
                break

        if header_row is None:
            # Try with header=0
            df = pd.read_excel(file_path, header=0)
            col_names = [str(c).strip().upper() for c in df.columns]
            if not any("ITEM" in c and "CODE" in c for c in col_names):
                return ProductUploadPreview(
                    products=[], total_rows=0,
                    errors=["Could not find 'ITEM CODE' column in the file. Please check the file format."]
                )
        else:
            # Re-read with correct header row
            df = pd.read_excel(file_path, header=header_row)

        # Normalize column names
        df.columns = [str(c).strip() for c in df.columns]
        col_upper = {c: c.upper() for c in df.columns}

        # Find column indices by keyword matching
        def find_col(keywords, exclude_keywords=None):
            for col, upper in col_upper.items():
                if all(kw in upper for kw in keywords):
                    if exclude_keywords and any(ek in upper for ek in exclude_keywords):
                        continue
                    return col
            return None

        item_code_col = find_col(["ITEM", "CODE"])
        desc_col = find_col(["DESCRIPTION"]) or find_col(["DESC"])
        type_col = find_col(["TYPE"])

        if not item_code_col:
            return ProductUploadPreview(
                products=[], total_rows=0,
                errors=["Could not find 'ITEM CODE' column."]
            )

        # Find MRP columns — they contain both company name and "MRP"
        # Strategy: find columns that have "MRP" in them
        mrp_columns = [c for c, u in col_upper.items() if "MRP" in u]

        # Map MRP columns to companies
        apollo_mrp = None
        supreme_mrp = None
        astral_mrp = None
        ashirvad_mrp = None

        for col in mrp_columns:
            upper = col.upper()
            if "APOLLO" in upper:
                apollo_mrp = col
            elif "SUPREME" in upper:
                supreme_mrp = col
            elif "ASTRAL" in upper:
                astral_mrp = col
            elif "ASHIRVAD" in upper:
                ashirvad_mrp = col

        # If MRP columns don't have company names embedded, try positional approach
        # The spec says columns are: ... APOLLO MRP | [calc] | SUPREME MRP | [calc] | ...
        if not any([apollo_mrp, supreme_mrp, astral_mrp, ashirvad_mrp]):
            # Fall back: find all columns with "MRP" and assign by order
            mrp_only = [c for c in mrp_columns if "MRP" == c.upper().strip()]
            if len(mrp_only) >= 4:
                apollo_mrp, supreme_mrp, astral_mrp, ashirvad_mrp = mrp_only[:4]
            elif len(mrp_columns) >= 4:
                # Take every other one (skip calculated columns)
                apollo_mrp = mrp_columns[0] if len(mrp_columns) > 0 else None
                supreme_mrp = mrp_columns[1] if len(mrp_columns) > 1 else None
                astral_mrp = mrp_columns[2] if len(mrp_columns) > 2 else None
                ashirvad_mrp = mrp_columns[3] if len(mrp_columns) > 3 else None

        # Process rows
        for idx, row in df.iterrows():
            item_code = row.get(item_code_col)
            if pd.isna(item_code) or str(item_code).strip() == "":
                continue  # Skip rows with blank ITEM CODE

            item_code = str(item_code).strip()
            description = str(row.get(desc_col, "")).strip() if desc_col and pd.notna(row.get(desc_col)) else ""
            material_type = str(row.get(type_col, "")).strip().upper() if type_col and pd.notna(row.get(type_col)) else ""

            # Validate material type
            if material_type not in ("PVC", "CPVC"):
                if material_type:
                    errors.append(f"Row {idx + 1}: Invalid material type '{material_type}' for {item_code}, defaulting to 'PVC'")
                material_type = "PVC"

            # Infer category from description
            category = infer_category(description)

            # Extract MRP values
            mrp_a = safe_decimal(row.get(apollo_mrp)) if apollo_mrp else None
            mrp_s = safe_decimal(row.get(supreme_mrp)) if supreme_mrp else None
            mrp_as = safe_decimal(row.get(astral_mrp)) if astral_mrp else None
            mrp_ah = safe_decimal(row.get(ashirvad_mrp)) if ashirvad_mrp else None

            products.append(ProductBase(
                product_code=item_code,
                description=description,
                category=category,
                material_type=material_type,
                mrp_apollo=mrp_a,
                mrp_supreme=mrp_s,
                mrp_astral=mrp_as,
                mrp_ashirvad=mrp_ah,
            ))

    except Exception as e:
        errors.append(f"Error parsing file: {str(e)}")

    return ProductUploadPreview(
        products=products,
        total_rows=len(products),
        errors=errors,
    )


def parse_discount_data(file_path: str, current_discounts: dict = None) -> DiscountUploadPreview:
    """
    Parse discount_data Excel file.

    Expected layout:
        Row 1: merged header "PVC DISCOUNT" (4 cols) | "CPVC DISCOUNT" (4 cols)
        Row 2: APOLLO | SUPREME | ASTRAL | ASHIRVAD | APOLLO | SUPREME | ASTRAL | ASHIRVAD
        Row 3: PIPE values (8 numbers)
        Row 4: FITTING values (8 numbers)
        Row 5: SOLVENT values (8 numbers)

    Parses into 24 records: (company, category, material_type, discount_percent)
    """
    errors = []
    cells = []
    changes = []

    if current_discounts is None:
        current_discounts = {}

    try:
        df = pd.read_excel(file_path, header=None)

        # Find the data area — look for row containing company names
        company_row = None
        for idx, row in df.iterrows():
            row_values = [str(v).strip().upper() for v in row.values if pd.notna(v)]
            if "APOLLO" in row_values and "SUPREME" in row_values:
                company_row = idx
                break

        if company_row is None:
            return DiscountUploadPreview(
                cells=[], changes=[],
                errors=["Could not find company headers (APOLLO, SUPREME, etc.) in the file."]
            )

        # Data rows start after the company header row
        data_start = company_row + 1

        # Find column positions for companies in PVC and CPVC sections
        header_row = df.iloc[company_row]

        # Map column indices to companies for each section
        pvc_cols = {}
        cpvc_cols = {}
        company_count = 0
        first_section = True

        for col_idx, val in enumerate(header_row):
            if pd.isna(val):
                continue
            val_str = str(val).strip().upper()
            if val_str in ["APOLLO", "SUPREME", "ASTRAL", "ASHIRVAD"]:
                company_count += 1
                if company_count <= 4:
                    pvc_cols[val_str.title()] = col_idx
                else:
                    cpvc_cols[val_str.title()] = col_idx

        if len(pvc_cols) < 4 or len(cpvc_cols) < 4:
            # Try alternative: assume first 4 company columns are PVC, next 4 are CPVC
            all_company_cols = []
            for col_idx, val in enumerate(header_row):
                if pd.notna(val) and str(val).strip().upper() in ["APOLLO", "SUPREME", "ASTRAL", "ASHIRVAD"]:
                    all_company_cols.append((str(val).strip().title(), col_idx))

            if len(all_company_cols) >= 8:
                pvc_cols = {name: idx for name, idx in all_company_cols[:4]}
                cpvc_cols = {name: idx for name, idx in all_company_cols[4:]}
            elif len(all_company_cols) >= 4:
                pvc_cols = {name: idx for name, idx in all_company_cols[:4]}
                # CPVC section may be missing — parse what we have
                errors.append("Warning: Could only find PVC discount columns. CPVC section may be missing.")

        # Category order: PIPE, FITTING, SOLVENT
        categories = ["Pipe", "Fitting", "Solvent"]

        for cat_idx, category in enumerate(categories):
            row_idx = data_start + cat_idx
            if row_idx >= len(df):
                errors.append(f"Missing row for category: {category}")
                continue

            row = df.iloc[row_idx]

            # PVC discounts
            for company, col_idx in pvc_cols.items():
                value = row.iloc[col_idx] if col_idx < len(row) else None
                d_val = safe_decimal(value)
                if d_val is None:
                    errors.append(
                        f"Invalid value at {category}/{company}/PVC: '{value}'. Must be numeric."
                    )
                    continue

                cells.append(DiscountBase(
                    company=company,
                    category=category,
                    material_type="PVC",
                    discount_percent=d_val,
                ))

                # Track changes
                key = (company, category, "PVC")
                old_val = current_discounts.get(key)
                if old_val is not None and old_val != d_val:
                    changes.append({
                        "company": company, "category": category,
                        "material_type": "PVC",
                        "old_value": str(old_val), "new_value": str(d_val),
                    })

            # CPVC discounts
            for company, col_idx in cpvc_cols.items():
                value = row.iloc[col_idx] if col_idx < len(row) else None
                d_val = safe_decimal(value)
                if d_val is None:
                    errors.append(
                        f"Invalid value at {category}/{company}/CPVC: '{value}'. Must be numeric."
                    )
                    continue

                cells.append(DiscountBase(
                    company=company,
                    category=category,
                    material_type="CPVC",
                    discount_percent=d_val,
                ))

                key = (company, category, "CPVC")
                old_val = current_discounts.get(key)
                if old_val is not None and old_val != d_val:
                    changes.append({
                        "company": company, "category": category,
                        "material_type": "CPVC",
                        "old_value": str(old_val), "new_value": str(d_val),
                    })

        # Validate we got all 24 cells
        if len(cells) != 24 and not errors:
            errors.append(f"Expected 24 discount values, got {len(cells)}. Check the file format.")

    except Exception as e:
        errors.append(f"Error parsing file: {str(e)}")

    return DiscountUploadPreview(cells=cells, changes=changes, errors=errors)

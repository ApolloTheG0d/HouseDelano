# Appointment Booking - Error Analysis Report

## Issues Found

### 1. **CRITICAL: Missing Service ID to Name Mapping** ⚠️
**File:** [public/appointmentForbooking.html](public/appointmentForbooking.html#L218)  
**Issue:** The `getServiceId()` function maps service names like 'grooming', 'boarding', etc. to hardcoded IDs (1-5), but these IDs may not match the actual database.

**Current Code:**
```javascript
function getServiceId(serviceName) {
  const serviceMap = {
    'grooming': 1,
    'boarding': 2,
    'daycare': 3,
    'training': 4,
    'walking': 5
  };
  return serviceMap[serviceName] || 1;
}
```

**Problem:** If the services table has different IDs in the database, bookings will fail or create bookings with wrong services.

**Fix:** Need to:
1. Load services from the API first
2. Dynamically populate the service select dropdown
3. Use correct service IDs from the database

---

### 2. **Missing Service Fetch on Page Load**
**File:** [public/appointmentForbooking.html](public/appointmentForbooking.html#L1)  
**Issue:** The page doesn't load services from `/api/services` endpoint when it loads. The service options are hardcoded with potentially wrong IDs.

**Recommended Fix:**
```javascript
// Fetch services from API on page load
async function loadServices() {
  try {
    const response = await fetch('/api/services');
    const result = await response.json();
    if (result.ok) {
      const serviceSelect = document.getElementById('service');
      // Clear existing options except the placeholder
      serviceSelect.innerHTML = '<option value="" data-price="0" selected>(select)</option>';
      
      // Add dynamic options from database
      result.services.forEach(service => {
        const option = document.createElement('option');
        option.value = service.id; // Use actual database ID
        option.dataset.price = service.price;
        option.textContent = `${service.name} — $${service.price}`;
        serviceSelect.appendChild(option);
      });
    }
  } catch (error) {
    console.error('Error loading services:', error);
  }
}
```

---

### 3. **Addon ID Mismatch** ⚠️
**File:** [public/appointmentForbooking.html](public/appointmentForbooking.html#L119)  
**Issue:** Addon checkboxes use hardcoded values (10, 12, 15) that should be addon IDs from the database.

**Current Code:**
```html
<label><input type="checkbox" value="10" data-label="De‑shedding (+$10)"> De‑shedding</label>
<label><input type="checkbox" value="12" data-label="Nail trim (+$12)"> Nail trim</label>
<label><input type="checkbox" value="15" data-label="Teeth cleaning (+$15)"> Teeth cleaning</label>
```

**Problem:** These addon IDs may not exist in the database.

**Fix:** Create an addons table and load them dynamically like services.

---

### 4. **Addon Data Structure Inconsistency**
**File:** [public/appointmentForbooking.html](public/appointmentForbooking.html#L249)  
**Issue:** The addon objects created have inconsistent structure:
```javascript
const selectedAddons = Array.from(document.querySelectorAll('#addons input:checked')).map(addon => ({
  id: addon.value,           // checkbox value = price (string like "10")
  price: parseFloat(addon.value),  // same as id
  name: addon.getAttribute('data-label') || addon.nextElementSibling?.textContent
}));
```

**Problem:** `id` contains the price, not a database addon ID.

---

### 5. **Potential Tax Rate Issue**
**File:** [public/appointmentForbooking.html](public/appointmentForbooking.html#L253)  
**Issue:** Hardcoded 8% tax rate may not be correct for all locations.

```javascript
const tax = subtotal * 0.08; // 8% tax - HARDCODED
```

---

### 6. **Empty Addon Data Sent to Backend**
**File:** [routes/bookings.js](routes/bookings.js#L82)  
**Issue:** When addons are sent, the addon processing expects `addon.id` to be a valid database ID, but the frontend sends price as ID.

```javascript
if (addons && Array.isArray(addons)) {
  for (const addon of addons) {
    await pool.query(
      `INSERT INTO booking_addons (booking_id, addon_id, price_at_purchase)
       VALUES ($1, $2, $3);`,
      [booking.id, addon.id, addon.price]  // addon.id might be price string!
    );
  }
}
```

---

## Summary of Errors

| # | Severity | Issue | Impact |
|---|----------|-------|--------|
| 1 | 🔴 CRITICAL | Service IDs hardcoded | Bookings may create with wrong services |
| 2 | 🟠 HIGH | Services not loaded from DB | Service options don't match database |
| 3 | 🟠 HIGH | Addon IDs hardcoded | Addon bookings will fail (invalid FK) |
| 4 | 🟠 HIGH | Addon data structure wrong | Backend receives price as ID |
| 5 | 🟡 MEDIUM | Hardcoded tax rate | May be incorrect for location |
| 6 | 🔴 CRITICAL | Missing validation | Invalid addon IDs cause DB errors |

---

## Recommended Actions

1. ✅ Create `/api/services` endpoint that returns all services with IDs and prices
2. ✅ Create `/api/addons` endpoint that returns all available add-ons with IDs and prices
3. ✅ Fetch services and addons on page load and populate dropdowns dynamically
4. ✅ Pass correct addon/service IDs from database (not hardcoded values)
5. ✅ Add validation on backend to reject invalid service/addon IDs
6. ✅ Consider making tax rate configurable (from database or settings)

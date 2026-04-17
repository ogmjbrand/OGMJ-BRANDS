# OGMJ BRANDS - Data Binding & Implementation Guide

**Status**: Core data binding complete with working example (Contacts page)  
**Last Updated**: April 17, 2026

---

## ✅ What's Now Working

### 1. Business Context System
**File**: `lib/context/BusinessContext.tsx`

- Manages current business and user globally
- Auto-fetches businesses on app load
- Provides context to all dashboard pages

```tsx
// Usage in any component
const { currentBusiness, user, loading } = useBusinessContext();
```

### 2. Data Flow Architecture

```
User Login
    ↓
Dashboard Layout (checks auth, provides BusinessContext)
    ↓
All Pages have access to currentBusiness
    ↓
Pages call Service Layer functions (lib/services/*.ts)
    ↓
Services call Supabase client
    ↓
Data fetched from PostgreSQL with RLS enforcement
    ↓
Results displayed in UI components
```

### 3. Contacts Page - Complete Working Example

**Pages**: `app/(dashboard)/crm/contacts/page.tsx`

#### Features
- ✅ Fetches real contacts from database
- ✅ Search functionality with debouncing
- ✅ Error handling with user feedback
- ✅ Loading states
- ✅ Empty state handling
- ✅ Create contact form with validation
- ✅ Auto-refresh after creation

#### Data Flow
```
1. Page loads → useEffect triggered
2. currentBusiness from context used
3. listContacts() service called with businessId
4. Service makes Supabase query with RLS enforcement
5. Results mapped to Contact[] type
6. Displayed in table
7. User clicks "Add Contact" → Modal opens
8. Form submitted → createContact() service called
9. Contact saved to database
10. Page refreshes, new contact appears in table
```

### 4. Form Components - CreateContactModal

**File**: `components/CreateContactModal.tsx`

Features:
- ✅ Form validation (required fields)
- ✅ Error alerts
- ✅ Loading states
- ✅ Cancel/Submit actions
- ✅ Auto-closes after success
- ✅ Triggers parent refresh

---

## 📋 How to Apply This Pattern to Other Pages

### Step 1: Use BusinessContext
```tsx
import { useBusinessContext } from '@/lib/context/BusinessContext';

export default function MyPage() {
  const { currentBusiness, loading: contextLoading } = useBusinessContext();
  // Use currentBusiness.id for all API calls
}
```

### Step 2: Fetch Data from Service Layer
```tsx
import { listSomeEntity } from '@/lib/services/crm'; // or other service

useEffect(() => {
  async function loadData() {
    if (!currentBusiness) return;

    const result = await listSomeEntity(currentBusiness.id, {
      page: 1,
      pageSize: 20,
    });

    if (result.success) {
      setData(result.data?.items || []);
    } else {
      setError(result.error);
    }
  }

  loadData();
}, [currentBusiness, searchTerm]);
```

### Step 3: Create Form Component
```tsx
// components/CreateXyzModal.tsx
export function CreateXyzModal({ isOpen, onClose, onSuccess }) {
  const { currentBusiness } = useBusinessContext();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await createXyz({
        businessId: currentBusiness.id,
        // ... other fields
      });

      if (result.success) {
        onSuccess(); // Trigger parent refresh
        onClose();
      } else {
        setError(result.error);
      }
    } finally {
      setLoading(false);
    }
  };

  // ... JSX
}
```

### Step 4: Integrate Modal into Page
```tsx
export default function XyzPage() {
  const [showModal, setShowModal] = useState(false);

  async function loadData() {
    // ... load data
  }

  return (
    <div>
      <button onClick={() => setShowModal(true)}>Create</button>

      <CreateXyzModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={() => loadData()}
      />
    </div>
  );
}
```

---

## 🔄 Services Layer Reference

### Available Services

**lib/auth.ts**
- `signUp()` - User registration
- `signIn()` - User login
- `signOut()` - Logout
- `getCurrentUser()` - Get authenticated user
- `resetPassword()` - Password reset flow

**lib/services/business.ts**
- `createBusiness()` - Create business
- `getBusiness()` - Get single business
- `listUserBusinesses()` - Get all user's businesses
- `updateBusiness()` - Update business
- `listBusinessMembers()` - Get team members
- `inviteUser()` - Send team invitation
- `acceptInvitation()` - Accept invite & join

**lib/services/crm.ts**
- `createContact()` - Create contact
- `getContact()` - Get single contact
- `listContacts()` - List with pagination & search
- `updateContact()` - Update contact
- `deleteContact()` - Delete contact
- `createDeal()` - Create deal
- `getDeal()` - Get single deal
- `listDeals()` - List with filtering
- `updateDeal()` - Update deal
- `createInteraction()` - Log interaction
- `createSupportTicket()` - Create ticket
- `listSupportTickets()` - List tickets

---

## 🎯 Pages Ready for Implementation

### High Priority (Next Tasks)

1. **Deals Page** (`app/(dashboard)/crm/deals/page.tsx`)
   - Use `listDeals()` service
   - Fetch from `currentBusiness.id`
   - Implement drag-and-drop stage movement
   - Add create deal modal

2. **Dashboard Homepage** (`app/(dashboard)/page.tsx`)
   - Fetch stats using aggregation queries
   - Show businesses grid
   - Show quick action cards
   - Implement navigation to full pages

3. **Videos Page** (`app/(dashboard)/videos/page.tsx`)
   - Fetch videos from database
   - Show video list with thumbnails
   - Add upload form

4. **Support Page** (`app/(dashboard)/support/page.tsx`)
   - Fetch support tickets
   - Implement ticket creation form
   - Add status/priority filtering

---

## 🔐 Security Features Built-In

All service layer functions automatically:
- ✅ Enforce authentication
- ✅ Enforce RLS policies
- ✅ Validate business_id ownership
- ✅ Return standardized error responses
- ✅ Log all changes to audit_logs
- ✅ Handle permissions via roles

---

## 🐛 Error Handling Pattern

All pages should follow this error handling pattern:

```tsx
const [error, setError] = useState<string | null>(null);

// Show error alert
{error && (
  <div className="p-4 bg-[#FF6B6B]/10 border border-[#FF6B6B]/20 rounded-lg flex gap-3">
    <AlertCircle className="w-5 h-5 text-[#FF6B6B]" />
    <p className="text-[#FF6B6B]">{error}</p>
  </div>
)}
```

---

## 💾 Supabase Integration

### How Queries Work

1. **Service calls Supabase client**
   ```tsx
   const { data, error } = await supabase
     .from('contacts')
     .select('*')
     .eq('business_id', businessId)
     .eq('status', 'lead');
   ```

2. **RLS policies automatically filter data**
   ```sql
   -- Only return contacts for user's businesses
   -- Enforced at database level
   ```

3. **Results return to UI**
   ```tsx
   if (result.success) {
     setContacts(result.data);
   }
   ```

---

## 📱 UI Component Patterns

### Loading State
```tsx
{loading && (
  <div className="flex items-center justify-center p-12">
    <div className="inline-block w-8 h-8 border-4 border-[#D4AF37]/20 border-t-[#D4AF37] rounded-full animate-spin"></div>
  </div>
)}
```

### Empty State
```tsx
{data.length === 0 && (
  <div className="p-12 text-center">
    <p className="text-[#D4AF37]/70 mb-4">No items</p>
    <button className="px-4 py-2 bg-[#D4AF37]/20 text-[#D4AF37] rounded-lg">
      Create first item
    </button>
  </div>
)}
```

### Error Alert
```tsx
{error && (
  <div className="p-4 bg-[#FF6B6B]/10 border border-[#FF6B6B]/20 rounded-lg">
    <AlertCircle className="w-5 h-5 text-[#FF6B6B]" />
    <p className="text-[#FF6B6B]">{error}</p>
  </div>
)}
```

---

## 🧪 Testing Your Implementation

### Test Contacts Page
1. Login with test account
2. Navigate to `/dashboard/crm/contacts`
3. Verify contacts load (should be empty initially)
4. Click "Add Contact"
5. Fill form and submit
6. Verify contact appears in table
7. Search for contact
8. Verify search works

### Test Other Pages
Same pattern:
1. Load page
2. Verify data fetches or shows empty state
3. Click create button
4. Fill form and submit
5. Verify new item appears

---

## 🚀 Next Implementation Priority

1. ✅ **Contacts** - COMPLETE (working with data binding)
2. ⏳ **Deals** - Need: data binding, drag-and-drop
3. ⏳ **Dashboard** - Need: stats aggregation, navigation
4. ⏳ **Support** - Need: data binding, ticket creation
5. ⏳ **Videos** - Need: data binding, upload form
6. ⏳ **Builder** - Need: data binding, editor
7. ⏳ **Analytics** - Need: stats queries, charts
8. ⏳ **Settings** - Need: data binding, update forms

---

## 📞 Troubleshooting

### "No business selected" error
- Make sure user is logged in
- Check BusinessContext is rendering in layout
- Verify user has created at least one business

### "Failed to load data" error
- Check if authentication is valid
- Verify business_id is correct
- Check browser console for API errors
- Check Supabase RLS policies

### Form not submitting
- Check form validation logic
- Verify required fields are filled
- Check browser console for errors
- Verify API endpoint is returning success

---

**Ready to implement more pages? Follow the Contacts page pattern!**

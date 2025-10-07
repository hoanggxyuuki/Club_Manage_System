# Loading Components

Bộ sưu tập các component loading để cải thiện UX của ứng dụng.

## Components

### LoadingSpinner

Component spinner loading cơ bản với nhiều tùy chọn.

```jsx
import { LoadingSpinner } from '../common';

<LoadingSpinner 
  size="lg" 
  color="primary" 
  text="Đang tải..." 
  fullScreen={false} 
/>
```

**Props:**
- `size`: 'sm' | 'md' | 'lg' | 'xl' - Kích thước spinner
- `color`: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'white' - Màu sắc
- `text`: string - Text hiển thị bên dưới spinner
- `fullScreen`: boolean - Hiển thị full screen overlay

### LoadingButton

Button với loading state tích hợp.

```jsx
import { LoadingButton } from '../common';

<LoadingButton 
  loading={isSubmitting}
  loadingText="Đang lưu..."
  variant="primary"
  size="md"
  onClick={handleSubmit}
>
  Lưu thay đổi
</LoadingButton>
```

**Props:**
- `loading`: boolean - Trạng thái loading
- `loadingText`: string - Text hiển thị khi loading
- `variant`: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'outline' | 'ghost'
- `size`: 'sm' | 'md' | 'lg'
- `disabled`: boolean - Disable button
- `className`: string - CSS classes bổ sung

### LoadingOverlay

Overlay loading cho form hoặc modal.

```jsx
import { LoadingOverlay } from '../common';

<LoadingOverlay 
  loading={isSubmitting}
  text="Đang xử lý..."
  backdrop={true}
  size="md"
>
  <form>
    {/* Form content */}
  </form>
</LoadingOverlay>
```

**Props:**
- `loading`: boolean - Trạng thái loading
- `text`: string - Text hiển thị
- `backdrop`: boolean - Hiển thị backdrop mờ
- `size`: 'sm' | 'md' | 'lg' | 'xl'
- `className`: string - CSS classes bổ sung

### Skeleton

Component skeleton loading cho content.

```jsx
import { Skeleton, CardSkeleton, TableSkeleton } from '../common';

// Basic skeleton
<Skeleton type="text" lines={3} />

// Card skeleton
<CardSkeleton />

// Table skeleton
<TableSkeleton rows={5} />
```

**Props:**
- `type`: 'text' | 'avatar' | 'card' | 'table' | 'list'
- `lines`: number - Số dòng cho text skeleton
- `width`: 'full' | '1/2' | '1/3' | '1/4' | '2/3' | '3/4'
- `height`: string - Chiều cao custom

### ErrorBoundary

Component bắt lỗi và hiển thị fallback UI.

```jsx
import { ErrorBoundary } from '../common';

<ErrorBoundary>
  <YourComponent />
</ErrorBoundary>
```

## Usage Examples

### Page Loading
```jsx
if (loading) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <LoadingSpinner size="lg" text="Đang tải trang..." />
    </div>
  );
}
```

### Form Submission
```jsx
<LoadingOverlay loading={isSubmitting} text="Đang lưu dữ liệu...">
  <form onSubmit={handleSubmit}>
    {/* Form fields */}
    <LoadingButton 
      loading={isSubmitting}
      loadingText="Đang lưu..."
      type="submit"
    >
      Lưu
    </LoadingButton>
  </form>
</LoadingOverlay>
```

### Data Table Loading
```jsx
{loading ? (
  <TableSkeleton rows={5} />
) : (
  <table>
    {/* Table content */}
  </table>
)}
```

### Button Actions
```jsx
<LoadingButton 
  loading={isDeleting}
  loadingText="Đang xóa..."
  variant="danger"
  onClick={handleDelete}
>
  Xóa
</LoadingButton>
```

## Best Practices

1. **Sử dụng LoadingSpinner** cho page loading và content loading
2. **Sử dụng LoadingButton** cho form actions và button actions
3. **Sử dụng LoadingOverlay** cho form submission và modal actions
4. **Sử dụng Skeleton** cho content loading để giảm perceived loading time
5. **Wrap components** với ErrorBoundary để xử lý lỗi gracefully

## Customization

Bạn có thể customize các component bằng cách:

1. **Override CSS classes** thông qua className prop
2. **Extend components** để thêm functionality mới
3. **Create theme variants** cho consistent styling

## Performance Tips

1. **Lazy load** các loading components khi cần thiết
2. **Use skeleton loading** thay vì spinner cho content loading
3. **Debounce** loading states để tránh flickering
4. **Cache** loading states để tránh re-render không cần thiết 
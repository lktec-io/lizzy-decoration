import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { FiUpload, FiX, FiPlus } from 'react-icons/fi';
import * as productService from '../../services/productService';
import * as categoryService from '../../services/categoryService';
import * as brandService from '../../services/brandService';
import QRCodeDisplay from '../../components/products/QRCodeDisplay';
import Modal from '../../components/common/Modal';
import PageSkeleton from '../../components/common/PageSkeleton';
import { useToast } from '../../hooks/useToast';
import '../../styles/pages/ProductForm.css';

// Shared by both the Category and Brand "+ Add" popups below -- each needs
// exactly the two fields the backend actually requires (name + code; see
// backend/validators/category.validator.js and brand.validator.js),
// nothing else, so a new item can be created without ever leaving the
// product form.
function QuickAddModal({ open, title, onClose, onCreate }) {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const resetFields = () => {
    setName('');
    setCode('');
    setError('');
  };

  const handleClose = () => {
    resetFields();
    onClose();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await onCreate({ name: name.trim(), code: code.trim() });
      resetFields();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={title}
      size="sm"
      footer={
        <>
          <button type="button" className="btn btn-secondary" onClick={handleClose}>Cancel</button>
          <button type="submit" form="quick-add-form" className={`btn btn-primary ${submitting ? 'btn-loading' : ''}`} disabled={submitting}>
            Create
          </button>
        </>
      }
    >
      {error && <div className="alert alert-danger mb-4" role="alert">{error}</div>}
      <form id="quick-add-form" onSubmit={handleSubmit} noValidate>
        <div className="form-group">
          <label className="form-label form-label-required" htmlFor="quick-add-name">Name</label>
          <input id="quick-add-name" className="form-control" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div className="form-group">
          <label className="form-label form-label-required" htmlFor="quick-add-code">Code</label>
          <input id="quick-add-code" className="form-control" value={code} onChange={(e) => setCode(e.target.value)} required />
        </div>
      </form>
    </Modal>
  );
}

function ProductForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const toast = useToast();
  const imageInputRef = useRef(null);

  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [images, setImages] = useState([]);
  const [productMeta, setProductMeta] = useState(null);
  const [loading, setLoading] = useState(isEdit);
  const [formError, setFormError] = useState('');
  const [priceConfirmRequired, setPriceConfirmRequired] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [brandModalOpen, setBrandModalOpen] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    getValues,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      name: '', categoryId: '', brandId: '', description: '',
      buyingPrice: '', sellingPrice: '', minStock: 0, status: 'active',
    },
  });

  useEffect(() => {
    categoryService.listActiveCategories().then(setCategories);
    brandService.listActiveBrands().then(setBrands);
  }, []);

  useEffect(() => {
    if (!isEdit) return;
    let cancelled = false;

    productService.getProduct(id).then((product) => {
      if (cancelled) return;
      reset({
        name: product.name,
        categoryId: String(product.category_id),
        brandId: String(product.brand_id),
        description: product.description || '',
        buyingPrice: product.buying_price,
        sellingPrice: product.selling_price,
        minStock: product.min_stock,
        status: product.status,
      });
      setImages(product.images || []);
      setProductMeta({ name: product.name, code: product.code });
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [id, isEdit, reset]);

  const submitProduct = async (values, confirmPriceOverride = false) => {
    setFormError('');
    const payload = {
      ...values,
      categoryId: Number(values.categoryId),
      brandId: Number(values.brandId),
      buyingPrice: Number(values.buyingPrice),
      sellingPrice: Number(values.sellingPrice),
      minStock: Number(values.minStock) || 0,
      confirmPriceOverride,
    };

    try {
      if (isEdit) {
        await productService.updateProduct(id, payload);
        toast.success('Product updated.');
        navigate('/products');
      } else {
        const created = await productService.createProduct(payload);
        toast.success('Product created.');
        navigate(`/products/${created.id}/edit`, { replace: true });
      }
    } catch (err) {
      const needsConfirm = err.response?.data?.errors?.some((e) => e.message === 'PRICE_OVERRIDE_REQUIRED');
      if (needsConfirm) {
        setPriceConfirmRequired(true);
        return;
      }
      setFormError(err.response?.data?.message || 'Failed to save product.');
    }
  };

  const onSubmit = (values) => submitProduct(values, false);
  const confirmPriceAndSubmit = () => {
    setPriceConfirmRequired(false);
    submitProduct(getValues(), true);
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const product = await productService.uploadProductImage(id, file);
      setImages(product.images);
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to upload image.');
    } finally {
      setUploadingImage(false);
      event.target.value = '';
    }
  };

  const handleRemoveImage = async (imageId) => {
    const product = await productService.removeProductImage(id, imageId);
    setImages(product.images);
  };

  const handleCreateCategory = async ({ name, code }) => {
    const created = await categoryService.createCategory({ name, code });
    const refreshed = await categoryService.listActiveCategories();
    setCategories(refreshed);
    setValue('categoryId', String(created.id), { shouldValidate: true });
    setCategoryModalOpen(false);
  };

  const handleCreateBrand = async ({ name, code }) => {
    const created = await brandService.createBrand({ name, code });
    const refreshed = await brandService.listActiveBrands();
    setBrands(refreshed);
    setValue('brandId', String(created.id), { shouldValidate: true });
    setBrandModalOpen(false);
  };

  if (loading) {
    return <PageSkeleton />;
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">{isEdit ? 'Edit Product' : 'New Product'}</h1>
          <p className="page-subtitle">{isEdit ? 'Update product details' : 'Add a new product to the catalog'}</p>
        </div>
      </div>

      {formError && <div className="alert alert-danger mb-4" role="alert">{formError}</div>}

      {priceConfirmRequired && (
        <div className="alert alert-warning mb-4" role="alert">
          <p className="mb-2">Buying price is higher than selling price. This will result in a loss on this product. Continue anyway?</p>
          <div className="flex gap-2">
            <button type="button" className="btn btn-danger btn-sm" onClick={confirmPriceAndSubmit}>Yes, Save Anyway</button>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => setPriceConfirmRequired(false)}>Cancel</button>
          </div>
        </div>
      )}

      {isEdit && (
        <div className="card mb-5">
          <div className="card-header"><span className="card-title">Product Images</span></div>
          <div className="card-body">
            <div className="product-image-gallery">
              {images.map((image) => (
                <div key={image.id} className="product-image-item">
                  <img src={image.image_path} alt="" />
                  <button type="button" className="product-image-remove" onClick={() => handleRemoveImage(image.id)} aria-label="Remove image">
                    <FiX />
                  </button>
                  {image.is_primary && <span className="badge badge-info product-image-primary-badge">Primary</span>}
                </div>
              ))}
              <button type="button" className="product-image-add" onClick={() => imageInputRef.current?.click()} disabled={uploadingImage}>
                {uploadingImage ? <span className="spinner" /> : <FiUpload />}
                <span>Add Image</span>
              </button>
              <input
                ref={imageInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                className="visually-hidden"
                onChange={handleImageUpload}
              />
            </div>
          </div>
        </div>
      )}

      {isEdit && productMeta && (
        <div className="card mb-5">
          <div className="card-header"><span className="card-title">QR Code</span></div>
          <div className="card-body">
            <QRCodeDisplay productId={id} productName={productMeta.name} />
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="card mb-5">
          <div className="card-header"><span className="card-title">Product Details</span></div>
          <div className="card-body">
            <div className="form-group">
              <label className="form-label form-label-required" htmlFor="name">Product Name</label>
              <input id="name" className={`form-control ${errors.name ? 'form-control-error' : ''}`} {...register('name', { required: 'Product name is required' })} />
              {errors.name && <span className="form-error">{errors.name.message}</span>}
            </div>
            <div className="form-row">
              <div className="form-group">
                <div className="flex items-center justify-between">
                  <label className="form-label form-label-required" htmlFor="categoryId">Category</label>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => setCategoryModalOpen(true)}>
                    <FiPlus aria-hidden="true" /> Add Category
                  </button>
                </div>
                <select id="categoryId" className={`form-control ${errors.categoryId ? 'form-control-error' : ''}`} {...register('categoryId', { required: 'Category is required' })}>
                  <option value="">Select a category</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                {errors.categoryId && <span className="form-error">{errors.categoryId.message}</span>}
              </div>
              <div className="form-group">
                <div className="flex items-center justify-between">
                  <label className="form-label form-label-required" htmlFor="brandId">Brand</label>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => setBrandModalOpen(true)}>
                    <FiPlus aria-hidden="true" /> Add Brand
                  </button>
                </div>
                <select id="brandId" className={`form-control ${errors.brandId ? 'form-control-error' : ''}`} {...register('brandId', { required: 'Brand is required' })}>
                  <option value="">Select a brand</option>
                  {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
                {errors.brandId && <span className="form-error">{errors.brandId.message}</span>}
              </div>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="description">Description</label>
              <textarea id="description" className="form-control" {...register('description')} />
            </div>
          </div>
        </div>

        <div className="card mb-5">
          <div className="card-header"><span className="card-title">Pricing &amp; Stock</span></div>
          <div className="card-body">
            <div className="form-row">
              <div className="form-group">
                <label className="form-label form-label-required" htmlFor="buyingPrice">Buying Price</label>
                <input
                  id="buyingPrice"
                  type="number"
                  step="0.01"
                  className={`form-control ${errors.buyingPrice ? 'form-control-error' : ''}`}
                  {...register('buyingPrice', { required: 'Buying price is required', min: { value: 0, message: 'Must be positive' } })}
                />
                {errors.buyingPrice && <span className="form-error">{errors.buyingPrice.message}</span>}
              </div>
              <div className="form-group">
                <label className="form-label form-label-required" htmlFor="sellingPrice">Selling Price</label>
                <input
                  id="sellingPrice"
                  type="number"
                  step="0.01"
                  className={`form-control ${errors.sellingPrice ? 'form-control-error' : ''}`}
                  {...register('sellingPrice', { required: 'Selling price is required', min: { value: 0, message: 'Must be positive' } })}
                />
                {errors.sellingPrice && <span className="form-error">{errors.sellingPrice.message}</span>}
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="minStock">Minimum Stock</label>
                <input id="minStock" type="number" className="form-control" {...register('minStock')} />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="status">Status</label>
                <select id="status" className="form-control" {...register('status')}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="form-actions">
          <button type="button" className="btn btn-secondary" onClick={() => navigate('/products')}>Cancel</button>
          <button type="submit" className={`btn btn-primary ${isSubmitting ? 'btn-loading' : ''}`} disabled={isSubmitting}>
            {isEdit ? 'Save Changes' : 'Create Product'}
          </button>
        </div>
      </form>

      <QuickAddModal
        open={categoryModalOpen}
        title="Add Category"
        onClose={() => setCategoryModalOpen(false)}
        onCreate={handleCreateCategory}
      />
      <QuickAddModal
        open={brandModalOpen}
        title="Add Brand"
        onClose={() => setBrandModalOpen(false)}
        onCreate={handleCreateBrand}
      />
    </div>
  );
}

export default ProductForm;

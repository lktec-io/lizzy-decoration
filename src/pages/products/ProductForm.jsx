import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation('products');
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
      setError(err.response?.data?.message || t('failedToCreate'));
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
          <button type="button" className="btn btn-secondary" onClick={handleClose}>{t('common:cancel')}</button>
          <button type="submit" form="quick-add-form" className={`btn btn-primary ${submitting ? 'btn-loading' : ''}`} disabled={submitting}>
            {t('common:create')}
          </button>
        </>
      }
    >
      {error && <div className="alert alert-danger mb-4" role="alert">{error}</div>}
      <form id="quick-add-form" onSubmit={handleSubmit} noValidate>
        <div className="form-group">
          <label className="form-label form-label-required" htmlFor="quick-add-name">{t('common:name')}</label>
          <input id="quick-add-name" className="form-control" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div className="form-group">
          <label className="form-label form-label-required" htmlFor="quick-add-code">{t('common:code')}</label>
          <input id="quick-add-code" className="form-control" value={code} onChange={(e) => setCode(e.target.value)} required />
        </div>
      </form>
    </Modal>
  );
}

function ProductForm() {
  const { t } = useTranslation('products');
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
        brandId: product.brand_id ? String(product.brand_id) : '',
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
      brandId: values.brandId ? Number(values.brandId) : null,
      buyingPrice: Number(values.buyingPrice),
      sellingPrice: Number(values.sellingPrice),
      minStock: Number(values.minStock) || 0,
      confirmPriceOverride,
    };

    try {
      if (isEdit) {
        await productService.updateProduct(id, payload);
        toast.success(t('productUpdated'));
        navigate('/products');
      } else {
        const created = await productService.createProduct(payload);
        toast.success(t('productCreated'));
        navigate(`/products/${created.id}/edit`, { replace: true });
      }
    } catch (err) {
      const needsConfirm = err.response?.data?.errors?.some((e) => e.message === 'PRICE_OVERRIDE_REQUIRED');
      if (needsConfirm) {
        setPriceConfirmRequired(true);
        return;
      }
      setFormError(err.response?.data?.message || t('failedToSaveProduct'));
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
      setFormError(err.response?.data?.message || t('failedToUploadImage'));
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
          <h1 className="page-title">{isEdit ? t('editProduct') : t('newProduct')}</h1>
          <p className="page-subtitle">{isEdit ? t('editProductSubtitle') : t('newProductSubtitle')}</p>
        </div>
      </div>

      {formError && <div className="alert alert-danger mb-4" role="alert">{formError}</div>}

      {priceConfirmRequired && (
        <div className="alert alert-warning mb-4" role="alert">
          <p className="mb-2">{t('priceOverrideWarning')}</p>
          <div className="flex gap-2">
            <button type="button" className="btn btn-danger btn-sm" onClick={confirmPriceAndSubmit}>{t('yesSaveAnyway')}</button>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => setPriceConfirmRequired(false)}>{t('common:cancel')}</button>
          </div>
        </div>
      )}

      {isEdit && (
        <div className="card mb-5">
          <div className="card-header"><span className="card-title">{t('productImages')}</span></div>
          <div className="card-body">
            <div className="product-image-gallery">
              {images.map((image) => (
                <div key={image.id} className="product-image-item">
                  <img src={image.image_path} alt="" />
                  <button type="button" className="product-image-remove" onClick={() => handleRemoveImage(image.id)} aria-label={t('removeImage')}>
                    <FiX />
                  </button>
                  {image.is_primary && <span className="badge badge-info product-image-primary-badge">{t('primary')}</span>}
                </div>
              ))}
              <button type="button" className="product-image-add" onClick={() => imageInputRef.current?.click()} disabled={uploadingImage}>
                {uploadingImage ? <span className="spinner" /> : <FiUpload />}
                <span>{t('addImage')}</span>
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
          <div className="card-header"><span className="card-title">{t('qrCode')}</span></div>
          <div className="card-body">
            <QRCodeDisplay productId={id} productName={productMeta.name} />
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="card mb-5">
          <div className="card-header"><span className="card-title">{t('productDetails')}</span></div>
          <div className="card-body">
            <div className="form-group">
              <label className="form-label form-label-required" htmlFor="name">{t('productName')}</label>
              <input id="name" className={`form-control ${errors.name ? 'form-control-error' : ''}`} {...register('name', { required: t('productNameRequired') })} />
              {errors.name && <span className="form-error">{errors.name.message}</span>}
            </div>
            <div className="form-row">
              <div className="form-group">
                <div className="flex items-center justify-between">
                  <label className="form-label form-label-required" htmlFor="categoryId">{t('common:category')}</label>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => setCategoryModalOpen(true)}>
                    <FiPlus aria-hidden="true" /> {t('addCategory')}
                  </button>
                </div>
                <select id="categoryId" className={`form-control ${errors.categoryId ? 'form-control-error' : ''}`} {...register('categoryId', { required: t('categoryRequired') })}>
                  <option value="">{t('selectCategory')}</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                {errors.categoryId && <span className="form-error">{errors.categoryId.message}</span>}
              </div>
              <div className="form-group">
                <div className="flex items-center justify-between">
                  <label className="form-label" htmlFor="brandId">{t('brandOptional')}</label>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => setBrandModalOpen(true)}>
                    <FiPlus aria-hidden="true" /> {t('addBrand')}
                  </button>
                </div>
                <select id="brandId" className="form-control" {...register('brandId')}>
                  <option value="">{t('noBrand')}</option>
                  {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="description">{t('common:description')}</label>
              <textarea id="description" className="form-control" {...register('description')} />
            </div>
          </div>
        </div>

        <div className="card mb-5">
          <div className="card-header"><span className="card-title">{t('pricingAndStock')}</span></div>
          <div className="card-body">
            <div className="form-row">
              <div className="form-group">
                <label className="form-label form-label-required" htmlFor="buyingPrice">{t('buyingPrice')}</label>
                <input
                  id="buyingPrice"
                  type="number"
                  step="0.01"
                  className={`form-control ${errors.buyingPrice ? 'form-control-error' : ''}`}
                  {...register('buyingPrice', { required: t('buyingPriceRequired'), min: { value: 0, message: t('mustBePositive') } })}
                />
                {errors.buyingPrice && <span className="form-error">{errors.buyingPrice.message}</span>}
              </div>
              <div className="form-group">
                <label className="form-label form-label-required" htmlFor="sellingPrice">{t('sellingPrice')}</label>
                <input
                  id="sellingPrice"
                  type="number"
                  step="0.01"
                  className={`form-control ${errors.sellingPrice ? 'form-control-error' : ''}`}
                  {...register('sellingPrice', { required: t('sellingPriceRequired'), min: { value: 0, message: t('mustBePositive') } })}
                />
                {errors.sellingPrice && <span className="form-error">{errors.sellingPrice.message}</span>}
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="minStock">{t('minimumStock')}</label>
                <input id="minStock" type="number" className="form-control" {...register('minStock')} />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="status">{t('common:status')}</label>
                <select id="status" className="form-control" {...register('status')}>
                  <option value="active">{t('common:active')}</option>
                  <option value="inactive">{t('common:inactive')}</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="form-actions">
          <button type="button" className="btn btn-secondary" onClick={() => navigate('/products')}>{t('common:cancel')}</button>
          <button type="submit" className={`btn btn-primary ${isSubmitting ? 'btn-loading' : ''}`} disabled={isSubmitting}>
            {isEdit ? t('saveChanges') : t('createProduct')}
          </button>
        </div>
      </form>

      <QuickAddModal
        open={categoryModalOpen}
        title={t('addCategory')}
        onClose={() => setCategoryModalOpen(false)}
        onCreate={handleCreateCategory}
      />
      <QuickAddModal
        open={brandModalOpen}
        title={t('addBrand')}
        onClose={() => setBrandModalOpen(false)}
        onCreate={handleCreateBrand}
      />
    </div>
  );
}

export default ProductForm;

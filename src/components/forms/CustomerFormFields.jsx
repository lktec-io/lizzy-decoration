// Same fields, same order, same markup for both Create and Edit — the
// caller (CustomerList.jsx) only differs in what values it resets the form
// to before opening the modal, never in which fields render.
function CustomerFormFields({ register, errors }) {
  return (
    <>
      <div className="form-group">
        <label className="form-label form-label-required" htmlFor="fullName">Full Name</label>
        <input
          id="fullName"
          className={`form-control ${errors.fullName ? 'form-control-error' : ''}`}
          autoFocus
          {...register('fullName', { required: 'Customer name is required.' })}
        />
        {errors.fullName && <span className="form-error">{errors.fullName.message}</span>}
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label form-label-required" htmlFor="phone">Phone Number</label>
          <input
            id="phone"
            className={`form-control ${errors.phone ? 'form-control-error' : ''}`}
            {...register('phone', { required: 'Phone number is required.' })}
          />
          {errors.phone && <span className="form-error">{errors.phone.message}</span>}
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            className={`form-control ${errors.email ? 'form-control-error' : ''}`}
            {...register('email', { pattern: { value: /^\S+@\S+\.\S+$/, message: 'Invalid email.' } })}
          />
          {errors.email && <span className="form-error">{errors.email.message}</span>}
        </div>
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="address">Address</label>
        <input id="address" className="form-control" {...register('address')} />
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="notes">Notes</label>
        <textarea id="notes" className="form-control" rows={3} {...register('notes')} />
      </div>
    </>
  );
}

export default CustomerFormFields;

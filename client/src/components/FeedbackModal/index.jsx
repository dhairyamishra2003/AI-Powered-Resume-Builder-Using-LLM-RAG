import './index.css';
import { useState, useEffect } from 'react';
import ModalLayout from '../../layouts/ModalLayout';
import { submitFeedback } from '../../services/feedbackService';
import { HiStar, HiCheckCircle } from 'react-icons/hi2';

function FeedbackModal({ isOpen, onClose }) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      setRating(0);
      setHoverRating(0);
      setFeedback('');
      setName('');
      setEmail('');
      setErrors({});
      setIsSubmitted(false);
      setIsSubmitting(false);
    }
  }, [isOpen]);

  const validate = () => {
    const newErrors = {};

    if (!rating || rating < 1 || rating > 5) {
      newErrors.rating = 'Please select a rating (1–5 stars).';
    }

    if (!feedback.trim()) {
      newErrors.feedback = 'Please provide your feedback.';
    }

    if (email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        newErrors.email = 'Please enter a valid email address.';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting || isSubmitted) return;

    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await submitFeedback({ rating, feedback, name, email });
      setIsSubmitted(true);
    } catch (err) {
      setErrors((prev) => ({
        ...prev,
        submit: err.message || 'Failed to submit feedback. Please try again.',
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (isSubmitting) return;
    onClose();
  };

  return (
    <ModalLayout isOpen={isOpen} onClose={handleClose} title={isSubmitted ? '' : 'Share Your Feedback'} size="md">
      {isSubmitted ? (
        <div className="feedback-success">
          <div className="feedback-success__icon">
            <HiCheckCircle />
          </div>
          <h3 className="feedback-success__title">Thank you for your feedback!</h3>
          <p className="feedback-success__desc">
            Your feedback helps us make AI Resume Builder even better.
          </p>
          <button type="button" className="btn btn-primary feedback-success__btn" onClick={handleClose}>
            Close
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="feedback-form" noValidate>
          {/* Star Rating */}
          <div className="feedback-field">
            <label className="feedback-label">
              Overall Rating <span className="feedback-required">*</span>
            </label>
            <div
              className="feedback-stars"
              role="radiogroup"
              aria-label="Rating out of 5 stars"
              onMouseLeave={() => setHoverRating(0)}
            >
              {[1, 2, 3, 4, 5].map((star) => {
                const active = star <= (hoverRating || rating);
                return (
                  <button
                    key={star}
                    type="button"
                    className={`feedback-star-btn ${active ? 'feedback-star-btn--active' : ''}`}
                    onClick={() => {
                      setRating(star);
                      if (errors.rating) {
                        setErrors((prev) => ({ ...prev, rating: undefined }));
                      }
                    }}
                    onMouseEnter={() => setHoverRating(star)}
                    aria-label={`${star} star${star > 1 ? 's' : ''}`}
                    aria-checked={rating === star}
                    role="radio"
                  >
                    <HiStar />
                  </button>
                );
              })}
            </div>
            {errors.rating && <span className="feedback-error">{errors.rating}</span>}
          </div>

          {/* Feedback Textarea */}
          <div className="feedback-field">
            <label htmlFor="feedback-text" className="feedback-label">
              Your Feedback <span className="feedback-required">*</span>
            </label>
            <textarea
              id="feedback-text"
              className={`feedback-textarea ${errors.feedback ? 'feedback-input--error' : ''}`}
              rows={4}
              placeholder="What do you like? What can we improve?"
              value={feedback}
              onChange={(e) => {
                setFeedback(e.target.value);
                if (errors.feedback) {
                  setErrors((prev) => ({ ...prev, feedback: undefined }));
                }
              }}
              disabled={isSubmitting}
            />
            {errors.feedback && <span className="feedback-error">{errors.feedback}</span>}
          </div>

          {/* Optional Name */}
          <div className="feedback-field">
            <label htmlFor="feedback-name" className="feedback-label">
              Name <span className="feedback-optional">(optional)</span>
            </label>
            <input
              id="feedback-name"
              type="text"
              className="feedback-input"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          {/* Optional Email */}
          <div className="feedback-field">
            <label htmlFor="feedback-email" className="feedback-label">
              Email <span className="feedback-optional">(optional)</span>
            </label>
            <input
              id="feedback-email"
              type="email"
              className={`feedback-input ${errors.email ? 'feedback-input--error' : ''}`}
              placeholder="you@example.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) {
                  setErrors((prev) => ({ ...prev, email: undefined }));
                }
              }}
              disabled={isSubmitting}
            />
            {errors.email && <span className="feedback-error">{errors.email}</span>}
          </div>

          {errors.submit && <div className="feedback-error feedback-error--block">{errors.submit}</div>}

          {/* Submit Button */}
          <div className="feedback-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
            </button>
          </div>
        </form>
      )}
    </ModalLayout>
  );
}

export default FeedbackModal;

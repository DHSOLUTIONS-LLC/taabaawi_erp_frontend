// src/features/help/components/HelpFeedback.tsx
import { useState } from 'react';
import { useSubmitArticleFeedbackMutation, useSubmitFaqFeedbackMutation } from '../../../services/helpApi';
import { useAppSelector, useAppDispatch } from '../../../app/hooks';
import { closeFeedbackModal } from '../helpSlice';

import close_icon from '../../../assets/icons/cross_icon.svg';

export default function HelpFeedback() {
  const dispatch = useAppDispatch();
  const { isFeedbackModalOpen, selectedFeedbackItem } = useAppSelector(state => state.help);
  
  const [feedbackType, setFeedbackType] = useState<'helpful' | 'not_helpful' | null>(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [submitArticleFeedback] = useSubmitArticleFeedbackMutation();
  const [submitFaqFeedback] = useSubmitFaqFeedbackMutation();

  if (!isFeedbackModalOpen || !selectedFeedbackItem) return null;

  const handleSubmit = async () => {
    if (!feedbackType) return;

    setIsSubmitting(true);
    try {
      if (selectedFeedbackItem.type === 'article') {
        await submitArticleFeedback({
          id: selectedFeedbackItem.id,
          feedback_type: feedbackType,
          comment: comment || undefined,
          rating: rating || undefined
        }).unwrap();
      } else {
        await submitFaqFeedback({
          id: selectedFeedbackItem.id,
          feedback_type: feedbackType,
          comment: comment || undefined
        }).unwrap();
      }
      setSubmitted(true);
      setTimeout(() => {
        dispatch(closeFeedbackModal());
      }, 2000);
    } catch (error) {
      console.error('Failed to submit feedback:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    dispatch(closeFeedbackModal());
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0 mt-20">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-500 opacity-1" onClick={handleClose}></div>
        </div>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                {submitted ? 'Thank You!' : 'Was this helpful?'}
              </h3>
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-500"
              >
                <img src={close_icon} alt="Close" className="w-5 h-5" />
              </button>
            </div>

            {submitted ? (
              <div className="text-center py-6">
                <div className="mb-4 text-green-500 text-5xl">✓</div>
                <p className="text-gray-700 mb-2">Thank you for your feedback!</p>
                <p className="text-sm text-gray-500">It helps us improve our content.</p>
              </div>
            ) : (
              <>
                <p className="text-gray-700 mb-4">
                  <span className="font-medium">{selectedFeedbackItem.title}</span>
                </p>

                <div className="flex justify-center space-x-4 mb-6">
                  <button
                    onClick={() => setFeedbackType('helpful')}
                    className={`flex flex-col items-center p-4 rounded-lg border-2 transition-colors ${
                      feedbackType === 'helpful'
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 hover:border-green-200'
                    }`}
                  >
                    <span className="text-3xl mb-1">👍</span>
                    <span className="text-sm font-medium">Yes, helpful</span>
                  </button>

                  <button
                    onClick={() => setFeedbackType('not_helpful')}
                    className={`flex flex-col items-center p-4 rounded-lg border-2 transition-colors ${
                      feedbackType === 'not_helpful'
                        ? 'border-red-500 bg-red-50'
                        : 'border-gray-200 hover:border-red-200'
                    }`}
                  >
                    <span className="text-3xl mb-1">👎</span>
                    <span className="text-sm font-medium">No, not helpful</span>
                  </button>
                </div>

                {feedbackType === 'helpful' && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      How would you rate this article? (Optional)
                    </label>
                    <div className="flex justify-center space-x-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onClick={() => setRating(star)}
                          className={`text-2xl ${
                            star <= rating ? 'text-yellow-400' : 'text-gray-300'
                          }`}
                        >
                          ★
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {feedbackType === 'not_helpful' && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      What was missing or unclear? (Optional)
                    </label>
                    <textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Please tell us how we can improve..."
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}

                <div className="flex justify-end space-x-3">
                  <button
                    onClick={handleClose}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={!feedbackType || isSubmitting}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
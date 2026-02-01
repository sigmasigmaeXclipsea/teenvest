import React, { useState } from 'react';
import { MessageCircle, X, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export default function FeedbackButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    category: 'General Feedback',
    message: '',
    email: ''
  });
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.message.trim()) {
      toast({
        title: "Message required",
        description: "Please enter your feedback before submitting.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const { error } = await supabase.from('feedback').insert({
        category: formData.category,
        message: formData.message,
        email: formData.email || null,
        status: 'new',
        created_at: new Date().toISOString()
      });

      if (error) throw error;

      toast({
        title: "Feedback submitted!",
        description: "Thank you for helping us improve TeenVest.",
      });

      // Reset form
      setFormData({
        category: 'General Feedback',
        message: '',
        email: ''
      });
      setIsOpen(false);
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast({
        title: "Failed to submit",
        description: "Please try again later.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Feedback Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 
                   bg-primary text-primary-foreground 
                   p-4 rounded-full shadow-lg 
                   hover:shadow-xl transform transition-all 
                   hover:scale-110 group"
        aria-label="Send feedback"
      >
        <MessageCircle className="w-6 h-6" />
        <span className="absolute -top-8 right-0 
                       bg-gray-900 text-white text-xs 
                       px-2 py-1 rounded opacity-0 
                       group-hover:opacity-100 transition-opacity whitespace-nowrap">
          Feedback
        </span>
      </button>
      
      {/* Feedback Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-2xl max-w-md w-full p-6 relative max-h-[90vh] overflow-y-auto">
            {/* Close Button */}
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            
            {/* Header */}
            <div className="mb-6">
              <h3 className="text-xl font-bold mb-2">
                Share Your Feedback
              </h3>
              <p className="text-sm text-muted-foreground">
                Help us improve TeenVest by sharing your thoughts, ideas, or reporting issues.
              </p>
            </div>
            
            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Category */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Category
                </label>
                <select 
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full p-3 border rounded-lg bg-background"
                >
                  <option>General Feedback</option>
                  <option>Bug Report</option>
                  <option>Feature Request</option>
                  <option>Tournament Ideas</option>
                  <option>Learning Content</option>
                  <option>UI/UX</option>
                </select>
              </div>
              
              {/* Message */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Your Feedback *
                </label>
                <textarea 
                  value={formData.message}
                  onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                  className="w-full p-3 border rounded-lg bg-background resize-none" 
                  rows={4}
                  placeholder="Tell us what you think..."
                  required
                />
              </div>
              
              {/* Email */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Email (optional)
                </label>
                <input 
                  type="email" 
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full p-3 border rounded-lg bg-background"
                  placeholder="your@email.com"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Only if you'd like us to follow up with you
                </p>
              </div>
              
              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsOpen(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1"
                >
                  {isSubmitting ? (
                    <>Submitting...</>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Send Feedback
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

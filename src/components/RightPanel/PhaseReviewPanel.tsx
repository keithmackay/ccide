import React, { useState } from 'react';
import { useAppStore } from '../../stores/appStore';
import { CheckCircle, FileText, Code, FileCode, ChevronDown, ChevronRight, Send } from 'lucide-react';
import { cn } from '../../utils/cn';

const PHASE_NAMES: Record<string, string> = {
  discovery: 'Project Discovery & Setup',
  specification: 'Idea & Specification',
  icp_personas: 'ICP & Personas',
  architecture: 'Architecture & Pages',
  uiux_design: 'UI/UX Design',
  prd: 'PRD & Implementation Planning',
  parallel_planning: 'Parallel Planning',
  implementation: 'Implementation',
  code_review: 'Code Review',
  performance: 'Performance Optimization',
  deployment: 'Deployment',
  documentation: 'Documentation',
  finalization: 'Finalization',
};

const DeliverableIcon: React.FC<{ type: string }> = ({ type }) => {
  switch (type) {
    case 'code':
      return <Code className="w-5 h-5 text-blue-400" />;
    case 'diagram':
      return <FileCode className="w-5 h-5 text-purple-400" />;
    default:
      return <FileText className="w-5 h-5 text-green-400" />;
  }
};

export const PhaseReviewPanel: React.FC = () => {
  const currentPhase = useAppStore((state) => state.currentPhase);
  const updatePhaseStatus = useAppStore((state) => state.updatePhaseStatus);
  const setRightPanelMode = useAppStore((state) => state.setRightPanelMode);
  const setRightPanelContent = useAppStore((state) => state.setRightPanelContent);

  const [feedback, setFeedback] = useState('');
  const [expandedDeliverable, setExpandedDeliverable] = useState<string | null>(null);

  if (!currentPhase) {
    return null;
  }

  const phaseName = PHASE_NAMES[currentPhase.phase] || currentPhase.phase;

  const handleContinue = () => {
    updatePhaseStatus('approved');
    setRightPanelMode('content');
    // Reset feedback
    setFeedback('');

    // Dispatch custom event to trigger conversation continuation
    window.dispatchEvent(new CustomEvent('phase-continue', {
      detail: { phase: currentPhase.phase }
    }));
  };

  const handleProvideFeedback = () => {
    if (!feedback.trim()) {
      return;
    }

    // Dispatch custom event with feedback
    window.dispatchEvent(new CustomEvent('phase-feedback', {
      detail: {
        phase: currentPhase.phase,
        feedback: feedback.trim()
      }
    }));

    updatePhaseStatus('active');
    setRightPanelMode('content');
    setFeedback('');
  };

  const handleDeliverableClick = (deliverable: typeof currentPhase.deliverables[0]) => {
    if (expandedDeliverable === deliverable.path) {
      setExpandedDeliverable(null);
    } else {
      setExpandedDeliverable(deliverable.path);
      // Load deliverable preview if not already loaded
      if (deliverable.preview) {
        setRightPanelContent(deliverable.preview, deliverable.name);
      }
    }
  };

  return (
    <div className="flex-1 overflow-auto bg-gray-900 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Phase Completion Header */}
        <div className="bg-gradient-to-r from-green-900/30 to-blue-900/30 border border-green-700/30 rounded-lg p-6">
          <div className="flex items-start gap-4">
            <CheckCircle className="w-8 h-8 text-green-400 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-green-400 mb-2">
                Phase Completed!
              </h2>
              <p className="text-lg text-gray-300 mb-1">{phaseName}</p>
              {currentPhase.completionMessage && (
                <p className="text-sm text-gray-400 mt-3">
                  {currentPhase.completionMessage}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Deliverables Section */}
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-200 mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Phase Deliverables ({currentPhase.deliverables.length})
          </h3>

          <div className="space-y-3">
            {currentPhase.deliverables.length === 0 ? (
              <p className="text-sm text-gray-500 italic">
                No deliverables specified for this phase.
              </p>
            ) : (
              currentPhase.deliverables.map((deliverable, index) => (
                <div
                  key={index}
                  className="bg-gray-750 border border-gray-700 rounded-lg overflow-hidden"
                >
                  <button
                    onClick={() => handleDeliverableClick(deliverable)}
                    className="w-full flex items-center gap-3 p-4 hover:bg-gray-700 transition-colors text-left"
                  >
                    <DeliverableIcon type={deliverable.type} />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-200">
                        {deliverable.name}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {deliverable.path}
                      </p>
                    </div>
                    {expandedDeliverable === deliverable.path ? (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    )}
                  </button>

                  {expandedDeliverable === deliverable.path && deliverable.preview && (
                    <div className="border-t border-gray-700 p-4 bg-gray-800">
                      <pre className="text-xs text-gray-300 whitespace-pre-wrap font-mono max-h-96 overflow-y-auto">
                        {deliverable.preview}
                      </pre>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Review Instructions */}
        <div className="bg-blue-900/20 border border-blue-700/30 rounded-lg p-4">
          <p className="text-sm text-gray-300">
            <span className="font-semibold text-blue-400">Review the deliverables above.</span>{' '}
            You can expand each item to see a preview. When you're ready, either continue to the
            next phase or provide feedback for improvements.
          </p>
        </div>

        {/* Feedback Section */}
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-200 mb-4">
            Provide Feedback (Optional)
          </h3>
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Share your thoughts, requests for changes, or additional requirements..."
            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            rows={5}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 justify-end">
          <button
            onClick={handleProvideFeedback}
            disabled={!feedback.trim()}
            className={cn(
              'px-6 py-3 rounded-lg transition-colors flex items-center gap-2',
              feedback.trim()
                ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                : 'bg-gray-700 text-gray-500 cursor-not-allowed'
            )}
          >
            <Send className="w-4 h-4" />
            <span className="font-medium">Provide Feedback</span>
          </button>
          <button
            onClick={handleContinue}
            className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center gap-2 font-medium"
          >
            <CheckCircle className="w-4 h-4" />
            <span>Continue to Next Phase</span>
          </button>
        </div>
      </div>
    </div>
  );
};

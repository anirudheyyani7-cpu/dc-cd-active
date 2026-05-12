import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronRight, Sparkles, RotateCcw } from 'lucide-react';
import { Button } from '../shared/Button';
import { AIThinkingLoader } from '../shared/LoadingDots';
import AIChatPanel from '../ai-chat/AIChatPanel';
import { parseMarkdown } from '../../utils/helpers';
import useAppStore from '../../store/appStore';

const ALL_STAGES = [
  { num: '01', label: 'Strategy', path: '/stage/01' },
  { num: '02', label: 'Sourcing', path: '/stage/02' },
  { num: '03', label: 'Design', path: '/stage/03' },
  { num: '04', label: 'Compliance', path: '/stage/04' },
  { num: '05', label: 'Operations', path: '/stage/05' },
  { num: '06', label: 'Monetization', path: '/stage/06' },
];

function StageProgress({ current }) {
  const navigate = useNavigate();
  return (
    <div className="flex items-center gap-0">
      {ALL_STAGES.map((s, i) => {
        const isCurrent = s.num === current;
        const isPast = parseInt(s.num) < parseInt(current);
        return (
          <div key={s.num} className="flex items-center">
            <button
              onClick={() => navigate(s.path)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                isCurrent
                  ? 'bg-[#00338D] text-white'
                  : isPast
                  ? 'bg-[#00A36C]/10 text-[#00A36C] hover:bg-[#00A36C]/15'
                  : 'bg-[#F4F6F9] text-[#9CA3AF] hover:bg-[#E2E8F0] hover:text-[#6B7280]'
              }`}
            >
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                isCurrent ? 'bg-white/20' : isPast ? 'bg-[#00A36C]/20 text-[#00A36C]' : 'bg-[#E2E8F0]'
              }`}>
                {isPast ? '✓' : s.num}
              </span>
              <span className="hidden sm:block">{s.label}</span>
            </button>
            {i < ALL_STAGES.length - 1 && (
              <ChevronRight size={14} className="text-[#CBD5E1] mx-0.5" />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function StageLayout({
  stageNum,
  stageName,
  stageDescription,
  stageIcon: StageIcon,
  color = '#00338D',
  formFields,
  generateInsights,
  systemContext,
}) {
  const navigate = useNavigate();
  const { stageOutputs, setStageOutput, markStageComplete } = useAppStore();
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);
  const [output, setOutput] = useState(stageOutputs[stageNum] || '');
  const [error, setError] = useState(null);

  const updateField = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await generateInsights(formData);
      setOutput(result);
      setStageOutput(stageNum, result);
      markStageComplete(stageNum);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const chatContext = output
    ? `Stage: ${stageName}\n\nUser Inputs:\n${Object.entries(formData).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`).join('\n')}\n\nAI Analysis:\n${output}`
    : `Stage: ${stageName}\n\nUser is working on datacenter ${stageName}.`;

  return (
    <div className="min-h-screen bg-[#F4F6F9] pt-16">
      {/* Stage Header */}
      <div className="border-b border-[#E2E8F0] bg-white">
        <div className="max-w-screen-xl mx-auto px-6 py-4">
          <div className="flex items-center gap-3 mb-3">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-1.5 text-sm text-[#6B7280] hover:text-[#1A1F36] transition-colors"
            >
              <ArrowLeft size={16} />
              Back to Lifecycle
            </button>
          </div>

          <div className="flex items-start justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: color + '15' }}
              >
                {StageIcon && <StageIcon size={24} style={{ color }} />}
              </div>
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <span
                    className="text-xs font-bold px-2 py-0.5 rounded-md"
                    style={{ backgroundColor: color + '12', color }}
                  >
                    STAGE {stageNum}
                  </span>
                </div>
                <h1
                  className="text-2xl font-extrabold text-[#1A1F36]"
                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                >
                  {stageName}
                </h1>
              </div>
            </div>
            <StageProgress current={stageNum} />
          </div>

          {stageDescription && (
            <p className="text-[#6B7280] text-sm mt-3 max-w-2xl leading-relaxed">{stageDescription}</p>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-screen-xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Form panel */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-[0_1px_3px_rgba(0,0,0,0.08)] overflow-hidden">
              <div className="px-6 py-4 border-b border-[#E2E8F0] flex items-center justify-between">
                <h2 className="text-[#1A1F36] font-bold text-sm" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  Analysis Parameters
                </h2>
                <button
                  onClick={() => setFormData({})}
                  className="text-[#9CA3AF] hover:text-[#6B7280] transition-colors"
                  title="Reset form"
                >
                  <RotateCcw size={14} />
                </button>
              </div>
              <div className="p-6 space-y-5">
                {formFields({ formData, updateField })}

                <div className="pt-2">
                  <Button
                    onClick={handleGenerate}
                    disabled={loading}
                    variant="primary"
                    size="lg"
                    className="w-full justify-center"
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles size={16} />
                        Generate Insights
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Output panel */}
          <div className="lg:col-span-3 flex flex-col gap-5">
            {/* AI Output */}
            <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-[0_1px_3px_rgba(0,0,0,0.08)] overflow-hidden flex-1">
              <div className="px-6 py-4 border-b border-[#E2E8F0] flex items-center gap-2">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: color + '15' }}
                >
                  <Sparkles size={14} style={{ color }} />
                </div>
                <h2 className="text-[#1A1F36] font-bold text-sm" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  AI-Generated Analysis
                </h2>
                {output && (
                  <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-[#00A36C]/10 text-[#00A36C] font-semibold">
                    Analysis ready
                  </span>
                )}
              </div>

              <div className="p-6 min-h-[300px]">
                {loading && <AIThinkingLoader />}

                {error && !loading && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-600 text-sm">
                    <p className="font-semibold mb-1">Error generating analysis</p>
                    <p className="text-red-500 text-xs">{error}</p>
                    <p className="text-red-400 text-xs mt-2">Ensure VITE_ANTHROPIC_API_KEY is set in your .env file.</p>
                  </div>
                )}

                {!loading && !output && !error && (
                  <div className="text-center py-12">
                    <div
                      className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                      style={{ backgroundColor: color + '10' }}
                    >
                      <Sparkles size={28} style={{ color }} />
                    </div>
                    <h3 className="text-[#1A1F36] font-bold text-sm mb-2" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                      Ready to generate insights
                    </h3>
                    <p className="text-[#9CA3AF] text-sm">
                      Fill in the parameters on the left and click "Generate Insights" to get your AI-powered analysis.
                    </p>
                  </div>
                )}

                {!loading && output && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="ai-output"
                    dangerouslySetInnerHTML={{ __html: parseMarkdown(output) }}
                  />
                )}
              </div>
            </div>

            {/* AI Chat */}
            <AIChatPanel
              context={chatContext}
              systemContext={systemContext}
              title={`${stageName} AI Advisor`}
              className="flex-shrink-0"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

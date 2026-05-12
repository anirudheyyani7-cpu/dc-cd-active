import { Activity } from 'lucide-react';
import StageLayout from '../components/stage-pages/StageLayout';
import { FormField, Select, TextInput, SliderField } from '../components/stage-pages/FormComponents';
import { callClaude, buildStagePrompt } from '../services/claude-api';

const STAGE_CONTEXT = `This stage covers day-to-day datacenter operations — staffing models, DCIM tooling, SLA management, PUE optimization, incident response, and predictive maintenance strategies.`;

function Fields({ formData, updateField }) {
  return (
    <>
      <FormField label="Number of Facilities">
        <TextInput
          value={formData.numFacilities}
          onChange={v => updateField('numFacilities', v)}
          placeholder="e.g., 3"
          type="number"
        />
      </FormField>

      <FormField label="Current Average PUE">
        <SliderField
          value={formData.currentPUE || 1.6}
          onChange={v => updateField('currentPUE', v)}
          min={1.1}
          max={2.5}
          step={0.05}
          formatValue={v => v.toFixed(2)}
          leftLabel="1.10 (Best)"
          rightLabel="2.50 (Poor)"
        />
      </FormField>

      <FormField label="Target PUE">
        <SliderField
          value={formData.targetPUE || 1.3}
          onChange={v => updateField('targetPUE', v)}
          min={1.1}
          max={2.0}
          step={0.05}
          formatValue={v => v.toFixed(2)}
          leftLabel="1.10 (Best)"
          rightLabel="2.00 (Basic)"
        />
      </FormField>

      <FormField label="Staffing Model">
        <Select
          value={formData.staffingModel}
          onChange={v => updateField('staffingModel', v)}
          options={[
            'Fully Staffed 24×7 (on-site team)',
            'Lights-Out / Remote Hands',
            'Hybrid (on-site days + remote nights)',
            'NOC-Centric (centralized network ops)',
          ]}
          placeholder="Select staffing model..."
        />
      </FormField>

      <FormField label="Monitoring & DCIM Approach">
        <Select
          value={formData.monitoring}
          onChange={v => updateField('monitoring', v)}
          options={[
            'Legacy DCIM (on-premise, limited)',
            'Modern DCIM (cloud-connected)',
            'AI-Augmented DCIM (predictive alerts)',
            'Fully Autonomous (AI-driven operations)',
          ]}
          placeholder="Select monitoring approach..."
        />
      </FormField>

      <FormField label="SLA Target Uptime">
        <Select
          value={formData.sla}
          onChange={v => updateField('sla', v)}
          options={['99.9% (8.76 hrs/yr downtime)', '99.95% (4.38 hrs/yr)', '99.99% (52.6 min/yr)', '99.999% (5.26 min/yr — Tier IV)']}
          placeholder="Select SLA target..."
        />
      </FormField>

      <FormField label="Average IT Load Utilization">
        <SliderField
          value={formData.utilization || 65}
          onChange={v => updateField('utilization', v)}
          min={10}
          max={100}
          step={5}
          formatValue={v => `${v}%`}
          leftLabel="10%"
          rightLabel="100%"
        />
      </FormField>
    </>
  );
}

async function generateInsights(formData) {
  const prompt = buildStagePrompt(
    'Stage 05: DC Operations',
    STAGE_CONTEXT,
    formData,
    null
  );
  return callClaude({ prompt, maxTokens: 2500 });
}

export default function Stage05() {
  return (
    <StageLayout
      stageNum="05"
      stageName="DC Operations"
      stageDescription="Optimize your datacenter operations across efficiency, staffing, monitoring, and uptime. Get AI-powered recommendations for PUE improvement, DCIM tooling, incident response frameworks, and cost-per-MW benchmarking."
      stageIcon={Activity}
      color="#003580"
      formFields={Fields}
      generateInsights={generateInsights}
    />
  );
}

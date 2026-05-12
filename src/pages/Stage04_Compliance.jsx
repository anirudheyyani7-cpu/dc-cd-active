import { ShieldCheck } from 'lucide-react';
import StageLayout from '../components/stage-pages/StageLayout';
import { FormField, Select, MultiSelect, Toggle } from '../components/stage-pages/FormComponents';
import { callClaude, buildStagePrompt } from '../services/claude-api';

const STAGE_CONTEXT = `This stage covers the compliance, regulatory, tax, and certification requirements for datacenter operations across multiple jurisdictions — including data protection laws, technical standards, cybersecurity frameworks, and ESG reporting obligations.`;

function Fields({ formData, updateField }) {
  return (
    <>
      <FormField label="Operating Jurisdictions" hint="select all that apply">
        <MultiSelect
          value={formData.jurisdictions}
          onChange={v => updateField('jurisdictions', v)}
          options={['India (DPDP Act)', 'Singapore (PDPA)', 'Ireland (GDPR)', 'United Kingdom (UK GDPR)', 'United States (State laws)', 'European Union (CSRD/NIS2)']}
        />
      </FormField>

      <FormField label="Compliance Frameworks Required" hint="select all applicable">
        <MultiSelect
          value={formData.frameworks}
          onChange={v => updateField('frameworks', v)}
          options={[
            'DPDP Act (India)', 'GDPR', 'TIA-942', 'ISO 27001',
            'SOC 2 Type II', 'PCI DSS', 'HIPAA', 'ESG/CSRD',
            'Uptime Institute Tier', 'LEED/BREEAM', 'FedRAMP', 'MTCS (Singapore)',
            'Cyber Essentials Plus (UK)', 'NIS2 Directive'
          ]}
        />
      </FormField>

      <FormField label="Data Sovereignty Requirements">
        <Select
          value={formData.sovereignty}
          onChange={v => updateField('sovereignty', v)}
          options={['Strict Local (data must not leave country)', 'Regional (within region/continent)', 'Flexible (cross-border permitted with controls)', 'Not Applicable']}
          placeholder="Select data sovereignty level..."
        />
      </FormField>

      <FormField label="Cybersecurity Maturity Level">
        <Select
          value={formData.cyberMaturity}
          onChange={v => updateField('cyberMaturity', v)}
          options={['Basic (firewall + antivirus)', 'Intermediate (SIEM + MFA)', 'Advanced (SOC + threat intelligence)', 'Zero Trust Architecture']}
          placeholder="Select cybersecurity level..."
        />
      </FormField>

      <FormField label="ESG Reporting Required">
        <Toggle
          checked={formData.esgReporting || false}
          onChange={v => updateField('esgReporting', v)}
          label="Mandatory ESG / Sustainability Reporting"
        />
      </FormField>

      <FormField label="Audit Readiness Timeline">
        <Select
          value={formData.auditTimeline}
          onChange={v => updateField('auditTimeline', v)}
          options={['Immediate (< 3 months)', '3–6 months', '6–12 months', '12–18 months', 'No specific deadline']}
          placeholder="Select audit timeline..."
        />
      </FormField>
    </>
  );
}

async function generateInsights(formData) {
  const prompt = buildStagePrompt(
    'Stage 04: Compliance Checks (Tax, Regulatory, ESG, Cyber)',
    STAGE_CONTEXT,
    formData,
    null
  );
  return callClaude({ prompt, maxTokens: 2500 });
}

export default function Stage04() {
  return (
    <StageLayout
      stageNum="04"
      stageName="Compliance Checks"
      stageDescription="Navigate the complex compliance landscape across datacenter jurisdictions. Get a gap analysis against required frameworks, jurisdiction-specific regulatory checklists, and a prioritized certification roadmap."
      stageIcon={ShieldCheck}
      color="#1B3A5C"
      formFields={Fields}
      generateInsights={generateInsights}
    />
  );
}

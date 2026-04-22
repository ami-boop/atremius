import { motion } from 'framer-motion';
import PhysiologicalStatus from '../dashboard/PhysiologicalStatus';
import VitalityInput from './VitalityInput';
import MomentumChartAnalytics from './MomentumChartAnalytics';
import ForecastChart from './ForecastChart';

export default function AnalyticsTab({
  physiology,
  onPhysiologyChange,
  vitality,
  vitalityComments,
  onVitalityChange,
  onVitalityCommentsChange,
  momentumChartAnalytics,
  onMomentumChartAnalyticsValueChange,
  forecast,
  onForecastChange,
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-4"
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <PhysiologicalStatus pointState={physiology} onChange={onPhysiologyChange} />
        <VitalityInput
          values={vitality}
          comments={vitalityComments}
          onValuesChange={onVitalityChange}
          onCommentsChange={onVitalityCommentsChange}
        />
      </div>
      <MomentumChartAnalytics data={momentumChartAnalytics} onValueChange={onMomentumChartAnalyticsValueChange} />
      <ForecastChart forecast={forecast} onChange={onForecastChange} />
    </motion.div>
  );
}

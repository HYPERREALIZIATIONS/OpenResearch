import React from 'react';
import { Box, Text } from 'ink';

interface Props {
  reports: string[];
}

const ReportView: React.FC<Props> = ({ reports }) => {
  return (
    <Box flexDirection="column" paddingX={1}>
      <Text bold color="magenta">Generated Reports</Text>
      {reports.length === 0 ? (
        <Text color="gray">No reports generated yet. Run a research query first.</Text>
      ) : (
        reports.map((report, i) => (
          <Box key={i}>
            <Text color="cyan">{i + 1}. {report}</Text>
          </Box>
        ))
      )}
    </Box>
  );
};

export default ReportView;

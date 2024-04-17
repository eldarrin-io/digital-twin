import * as React from 'react';
import { PageSection, Title } from '@patternfly/react-core';
import Ecosystem from "@app/MetaModel/Ecosystem/Ecosystem";

const MetaModel: React.FunctionComponent = () => (
  <PageSection>
    <Title headingLevel="h1" size="lg">
      MetaModel Page Title
    </Title>
    <Ecosystem />
  </PageSection>
);

export { MetaModel };

import * as React from 'react';
import {Card, CardBody, CardTitle, Grid, GridItem, PageSection, Title} from '@patternfly/react-core';

const Dashboard: React.FunctionComponent = () => (
  <PageSection>
    <Title headingLevel="h1" size="lg">Digital Twin Highlights!</Title>
    <Grid>
      <GridItem span={4}>
        <Card>
          <CardTitle>Card Title</CardTitle>
          <CardBody>This is a card body</CardBody>
        </Card>
      </GridItem>
      <GridItem span={4}>
        <Card>
          <CardTitle>Card Title</CardTitle>
          <CardBody>This is a card body</CardBody>
        </Card>
      </GridItem>
      <GridItem span={4}>
        <Card>
          <CardTitle>Card Title</CardTitle>
          <CardBody>This is a card body</CardBody>
        </Card>
      </GridItem>
    </Grid>
  </PageSection>
)

export { Dashboard };

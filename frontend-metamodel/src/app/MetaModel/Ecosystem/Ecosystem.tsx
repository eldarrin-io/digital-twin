import React from 'react';
import {
  Form,
  FormGroup,
  TextInput,
  Checkbox,
  Popover,
  ActionGroup,
  Button,
  Radio,
  HelperText,
  HelperTextItem,
  FormHelperText
} from '@patternfly/react-core';
import HelpIcon from '@patternfly/react-icons/dist/esm/icons/help-icon';
import styles from '@patternfly/react-styles/css/components/Form/form';

export const Ecosystem: React.FunctionComponent = () => {
  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [ecosystemOwners, setEcosystemOwners] = React.useState('');
  const [companyName, setCompanyName] = React.useState('');

  const handleNameChange = (_event, name: string) => {
    setName(name);
  };

  const handleEmailChange = (_event, email: string) => {
    setEmail(email);
  };

  const handleCompanyNameChange = (_event, companyName: string) => {
    setCompanyName(companyName);
  };

  const handleEcosystemOwnersChange = (_event, ecosystemOwners: string) => {
    setEcosystemOwners(ecosystemOwners);
  };

  return (
    <Form>
      <FormGroup
        label="Name"
        labelIcon={
          <Popover
            headerContent={
              <div>
                The name of the Ecosystem.
              </div>
            }
            bodyContent={
              <div>
                Must be unique with the digital twin system.
              </div>
            }
          >
            <button
              type="button"
              aria-label="More info for name field"
              onClick={(e) => e.preventDefault()}
              aria-describedby="simple-form-name-01"
              className={styles.formGroupLabelHelp}
            >
              <HelpIcon />
            </button>
          </Popover>
        }
        isRequired
        fieldId="simple-form-name-01"
      >
        <TextInput
          isRequired
          type="text"
          id="simple-form-name-01"
          name="simple-form-name-01"
          aria-describedby="simple-form-name-01-helper"
          value={name}
          onChange={handleNameChange}
        />
        <FormHelperText>
          <HelperText>
            <HelperTextItem>Try to provide a meaningful name, such as UST-UK-Architects.</HelperTextItem>
          </HelperText>
        </FormHelperText>
      </FormGroup>
      <FormGroup label="Email" isRequired fieldId="simple-form-email-01">
        <TextInput
          isRequired
          type="email"
          id="simple-form-email-01"
          name="simple-form-email-01"
          value={email}
          onChange={handleEmailChange}
        />
      </FormGroup>
      <FormGroup label="Company Name" isRequired fieldId="simple-form-companyname-01">
        <TextInput
          isRequired
          type="text"
          id="simple-form-companyname-01"
          name="simple-form-companyname-01"
          value={companyName}
          onChange={handleCompanyNameChange}
        />
      </FormGroup>
      <FormGroup label="Ecosystem Owners" isRequired fieldId="simple-form-ecoowners-01">
        <TextInput
          type="text"
          id="simple-form-ecoowners-01"
          name="simple-form-ecoowners-01"
          value={ecosystemOwners}
          onChange={handleEcosystemOwnersChange}
        />
      </FormGroup>
      <FormGroup label="Additional note" fieldId="simple-form-note-01">
        <TextInput isDisabled type="text" id="simple-form-note-01" name="simple-form-number" value="disabled" />
      </FormGroup>
      <FormGroup fieldId="checkbox01">
        <Checkbox label="I'd like updates via email." id="checkbox01" name="checkbox01" aria-label="Update via email" />
      </FormGroup>
      <ActionGroup>
        <Button variant="primary">Save</Button>
        <Button variant="link">Cancel</Button>
      </ActionGroup>
    </Form>
  );
};

export default Ecosystem;

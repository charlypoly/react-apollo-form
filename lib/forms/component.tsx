// tslint:disable:no-any
import * as React from 'react';
import Form, {
    ArrayFieldTemplateProps,
    UiSchema,
    FieldTemplateProps,
    ObjectFieldTemplateProps,
    IChangeEvent
} from 'react-jsonschema-form';
import {
    AlineFormConfig,
    AlineFormConfigMutation,
    transformErrors,
    isMutationConfig,
    cleanData,
    ReactJsonschemaFormError,
    getSchemaFromConfig
} from './utils';
import { titleRenderer, buttonsRenderer, FormRenderer, saveButtonRenderer, cancelButtonRenderer } from './renderers';
import { JSONSchema6 } from 'json-schema';
import { ApolloProvider } from 'react-apollo';
import { ApolloClient } from 'apollo-client';

type ErrorListComponent = React.SFC<{
    errors: ReactJsonschemaFormError[];
    errorSchema: object;
    schema: object;
    uiSchema: UiSchema;
    formContext: object;
}>;

// Augment SchemaUi for AlineForm ui prop
export type AlineFormUi = {
    showErrorList?: boolean;
    errorListComponent?: ErrorListComponent;
    templates?: {
        FieldTemplate?: React.StatelessComponent<FieldTemplateProps>;
        ArrayFieldTemplate?: React.StatelessComponent<ArrayFieldTemplateProps>;
        ObjectFieldTemplate?: React.StatelessComponent<ObjectFieldTemplateProps>;
    }
};

type AlineFormProps = {
    data: any;
    title?: string;
    subTitle?: string;
    config: AlineFormConfig;
    onSave?: (data: object) => void;
    onCancel?: () => void;
    ui?: UiSchema & AlineFormUi;
    children?: React.SFC<AlineRenderProps>;
};

interface AlineFormState {
    isDirty: boolean;
    isSaved: boolean;
    hasError: boolean;
    schema: JSONSchema6;
    data: any;
}

interface AlineRenderProps {
    // renderers
    header: () => React.ReactNode;
    form: () => React.ReactNode;
    buttons: () => React.ReactNode;
    saveButton: () => React.ReactNode;
    cancelButton: () => React.ReactNode;
    // actions
    cancel: () => void;
    save: (args: any) => void;
    // state
    isDirty: boolean;
    isSaved: boolean;
    hasError: boolean;
    data: any;
}


export class AlineForm extends React.Component<AlineFormProps, AlineFormState> {

    submitBtn!: HTMLInputElement | null;
    apolloClient!: ApolloClient<{}>;

    state: AlineFormState = {
        isDirty: false,
        isSaved: false,
        hasError: false,
        schema: {},
        data: {}
    };

    static getDerivedStateFromProps(nextProps: AlineFormProps) {
        return {
            schema: getSchemaFromConfig(nextProps.config, nextProps.title),
            data: nextProps.data
        };
    }

    componentDidUpdate(prevProps: AlineFormProps) {
        const { config } = this.props;
        const { config: prevConfig } = prevProps;
        if (config && isMutationConfig(config) && !!config.mutation) {
            if (isMutationConfig(prevConfig) && !!prevConfig.mutation) {
                const currentMutationName = config.mutation.name;
                const previousMutationName = prevConfig.mutation.name;
                if (currentMutationName !== previousMutationName) {
                    this.setState({
                        schema: getSchemaFromConfig(config, this.props.title)
                    });
                }
            } else {
                this.setState({
                    schema: getSchemaFromConfig(config, this.props.title)
                });
            }
        }
    }

    // build save handler for <Form> component
    save = ({ formData }: any) => { // TODO: remove args
        const { config, onSave } = this.props;
        if (isMutationConfig(config)) {
            const { mutation: { document, variables, context, refetchQueries } } = config;
            const data = cleanData(formData, this.state.schema.properties || {});
            this.apolloClient.mutate({
                mutation: document,
                refetchQueries,
                variables: {
                    ...data,
                    ...(variables || {})
                },
                context: context
            }).then(() => {
                this.setState(() => ({ isDirty: false, isSaved: true, hasError: false }));
                if (onSave) {
                    onSave(data);
                }
            });
        } else {
            config.saveData(formData);
        }
    }

    cancel = () => {
        const { props } = this;
        if (props.onCancel) {
            props.onCancel();
        }
    }

    onChange = (data: IChangeEvent) => {
        this.setState(() => ({
            isDirty: true,
            data: data.formData,
            hasError: data.errors.length > 0,
            isSaved: false
        }));
    }

    simulateSubmit = () => {
        if (this.submitBtn) {
            this.submitBtn.click();
        }
    }

    childrenProps = (): AlineRenderProps => ({
        // renderers
        header: () => titleRenderer({ title: this.props.title || 'Form' }),
        form: this.renderForm,
        buttons: () => buttonsRenderer({
            cancel: this.cancel,
            save: this.simulateSubmit,
            hasError: this.state.hasError,
            isSaved: this.state.isSaved,
            isDirty: this.state.isDirty
        }),
        saveButton: () => saveButtonRenderer({
            save: this.simulateSubmit,
            hasError: this.state.hasError,
            isDirty: this.state.isDirty,
            isSaved: this.state.isSaved
        }),
        cancelButton: () => cancelButtonRenderer({ cancel: this.cancel }),
        // actions
        cancel: this.cancel,
        save: this.simulateSubmit,
        // state,
        data: this.state.data,
        isDirty: this.state.isDirty,
        isSaved: this.state.isSaved,
        hasError: this.state.hasError
    })

    renderLayout = () => {
        const { props } = this;
        const { buttons, header, form } = this.childrenProps();
        return (
            <div>
                {header()}
                {form()}
                {buttons()}
            </div>
        );
    }

    renderForm = () => {
        return (
            <FormRenderer
                // widgets={widgets}
                // fields={fields}
                onChange={this.onChange}
                save={this.save}
                transformErrors={transformErrors}
                config={this.props.config}
                ui={this.props.ui}
                schema={this.state.schema}
                data={this.state.data}
                subTitle={this.props.subTitle}
                isDirty={this.state.isDirty}
            >
                <input type="submit" style={{ display: 'none' }} ref={el => this.submitBtn = el} />
            </FormRenderer>
        );
    }

    render() {
        const { props } = this;
        const children = props.children as AlineFormProps['children'];
        return (
            children ?
                children(this.childrenProps()) :
                this.renderLayout()
        );
    }
}

// tslint:disable:no-any
import { ApolloClient } from 'apollo-client';
import { JSONSchema6 } from 'json-schema';
import * as React from 'react';
import {
    IChangeEvent,
    UiSchema,
    WidgetProps
} from 'react-jsonschema-form';
import { getTheme, ApolloFormTheme, ErrorListComponent } from './renderers';
import { FormRenderer } from './renderers';
import {
    applyConditionsToSchema,
    cleanData,
    getSchemaFromConfig,
    isMutationConfig,
    ApolloFormConfig,
    ReactJsonschemaFormError
} from './utils';

// see https://github.com/wittydeveloper/react-apollo-form/wiki/Getting-started:-build-a-GraphQL-Form-in-5-minutes
export type ApolloFormProps<T> = {
    data: any;
    title?: string;
    subTitle?: string;
    config: ApolloFormConfig & { mutation?: { name: T } };
    onSave?: (data: object) => void;
    onChange?: (data: object) => void;
    onCancel?: () => void;
    ui?: UiSchema & ApolloFormUi;
    children?: React.SFC<ApolloRenderProps>;
    liveValidate?: boolean;
    transformErrors?: (formName: string) => (errors: ReactJsonschemaFormError[]) => ReactJsonschemaFormError[];
};

export interface ApolloFormState {
    isDirty: boolean;
    isSaved: boolean;
    hasError: boolean;
    // we store the original schema
    schema: JSONSchema6;
    // and we store the transformed schema (with applied UI conditionals)
    schemaWithConditionals: JSONSchema6;
    data: any;
}

// see https://github.com/wittydeveloper/react-apollo-form/wiki/Form-Rendering-customisation-with-renderers
export interface ApolloRenderProps {
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

export interface ApolloFormConfigureTheme {
    templates?: ApolloFormTheme['templates'];
    widgets?: ApolloFormTheme['widgets'];
    fields?: ApolloFormTheme['fields'];
    renderers?: Partial<ApolloFormTheme['renderers']>;
}

export interface ApolloFormConfigureOptions {
    client: ApolloClient<any>;
    theme?: ApolloFormConfigureTheme;
    jsonSchema: JSONSchema6;
    i18n?: (key: string) => string;
}

// Augment SchemaUi for ApolloForm ui prop
export type ApolloFormUi = {
    showErrorsList?: boolean;
    showErrorsInline?: boolean;
    errorListComponent?: ErrorListComponent;
};

export type ApolloFormComponent<T> = React.ComponentClass<ApolloFormProps<T>> & {
    registerWidget: (name: string, comp: React.SFC<WidgetProps>) => void;
};

// tslint:disable-next-line:max-line-length
export function configure<MutationNamesType = {}>(opts: ApolloFormConfigureOptions): ApolloFormComponent<MutationNamesType> {

    const jsonSchema: JSONSchema6 = opts.jsonSchema;
    const theme = getTheme(opts.theme);
    return class ApolloForm extends React.Component<ApolloFormProps<MutationNamesType>, ApolloFormState> {

        submitBtn: HTMLInputElement | null = null;

        state: ApolloFormState = {
            isDirty: false,
            isSaved: false,
            hasError: false,
            schema: {},
            schemaWithConditionals: {},
            data: {}
        };

        static registerWidget = (name: string, comp: React.SFC<WidgetProps>) => {
            theme.widgets[name] = comp;
        }

        componentDidMount() {
            const schema = getSchemaFromConfig(jsonSchema, this.props.config, this.props.title);
            this.setState(() => ({
                schema,
                data: this.props.data,
                schemaWithConditionals: applyConditionsToSchema(
                    schema,
                    this.props.ui,
                    this.state.data
                )
            }));
        }

        componentDidUpdate(prevProps: ApolloFormProps<MutationNamesType>) {
            const { config } = this.props;
            const { config: prevConfig } = prevProps;
            if (config && isMutationConfig(config) && !!config.mutation) {
                if (isMutationConfig(prevConfig) && !!prevConfig.mutation) {
                    const currentMutationName = config.mutation.name;
                    const previousMutationName = prevConfig.mutation.name;
                    if (currentMutationName !== previousMutationName) {
                        this.setState(
                            {
                                schema: getSchemaFromConfig(jsonSchema, config, this.props.title)
                            },
                            () => this.setState({
                                schemaWithConditionals: applyConditionsToSchema(
                                    this.state.schema,
                                    this.props.ui,
                                    this.state.data
                                )
                            })
                        );
                    }
                } else {
                    this.setState(
                        {
                            schema: getSchemaFromConfig(jsonSchema, config, this.props.title)
                        },
                        () => this.setState({
                            schemaWithConditionals: applyConditionsToSchema(
                                this.state.schema,
                                this.props.ui,
                                this.state.data
                            )
                        })
                    );
                }
            }
        }

        // build save handler for <Form> component
        save = ({ formData }: any) => { // TODO: remove args
            const { config, onSave } = this.props;
            if (isMutationConfig(config)) {
                const { mutation: { document, variables, context, refetchQueries } } = config;
                const data = cleanData(formData, this.state.schema.properties || {});
                opts.client.mutate({
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
            const newSchema = applyConditionsToSchema(
                this.state.schema,
                this.props.ui,
                data.formData
            );
            this.setState(
                () => ({
                    isDirty: true,
                    data: cleanData(data.formData, newSchema.properties),
                    schemaWithConditionals: newSchema,
                    hasError: data.errors.length > 0,
                    isSaved: false
                }),
                () => {
                    if (this.props.onChange) {
                        this.props.onChange(this.state.data);
                    }
                }
            );
        }

        simulateSubmit = () => {
            if (this.submitBtn) {
                this.submitBtn.click();
            }
        }

        childrenProps = (): ApolloRenderProps => ({
            // renderers
            header: () => theme.renderers.header({ title: this.props.title || 'Form' }),
            form: this.renderForm,
            buttons: () => theme.renderers.buttons({
                cancelButtonRenderer: theme.renderers.cancelButton,
                saveButtonRenderer: theme.renderers.saveButton,
                cancel: this.cancel,
                save: this.simulateSubmit,
                hasError: this.state.hasError,
                isSaved: this.state.isSaved,
                isDirty: this.state.isDirty
            }),
            saveButton: () => theme.renderers.saveButton({
                save: this.simulateSubmit,
                hasError: this.state.hasError,
                isDirty: this.state.isDirty,
                isSaved: this.state.isSaved
            }),
            cancelButton: () => theme.renderers.cancelButton({ cancel: this.cancel }),
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
                    theme={theme}
                    onChange={this.onChange}
                    save={this.save}
                    transformErrors={
                        this.props.transformErrors ?
                            this.props.transformErrors :
                            undefined
                    }
                    config={this.props.config}
                    ui={this.props.ui}
                    liveValidate={this.props.liveValidate}
                    schema={this.state.schemaWithConditionals}
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
            const children = props.children as ApolloFormProps<MutationNamesType>['children'];
            return (
                children ?
                    children(this.childrenProps()) :
                    this.renderLayout()
            );
        }
    };
}

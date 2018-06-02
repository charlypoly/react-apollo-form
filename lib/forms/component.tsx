import { ApolloClient } from 'apollo-client';
import { IntrospectionQuery } from 'graphql';
import { JSONSchema6 } from 'json-schema';
import { isString } from 'lodash';
import * as React from 'react';
import {
    ArrayFieldTemplateProps,
    FieldTemplateProps,
    IChangeEvent,
    ObjectFieldTemplateProps,
    UiSchema
} from 'react-jsonschema-form';
import { buttonsRenderer } from './renderers';
import { cancelButtonRenderer } from './renderers';
import { FormRenderer } from './renderers';
import {
    titleRenderer,
    ButtonsRendererProps,
    CancelButtonRendererProps,
    SaveButtonRendererProps,
    TitleRendererProps
} from './renderers';
import { saveButtonRenderer } from './renderers';
import {
    cleanData,
    getSchemaFromConfig,
    isMutationConfig,
    transformErrors,
    ApolloFormConfig,
    ReactJsonschemaFormError
} from './utils';

export type ErrorListComponent = React.SFC<{
    errors: ReactJsonschemaFormError[];
    errorSchema: object;
    schema: object;
    uiSchema: UiSchema;
    formContext: object;
}>;

// Augment SchemaUi for ApolloForm ui prop
export type ApolloFormUi = {
    showErrorsList?: boolean;
    showErrorsInline?: boolean;
    errorListComponent?: ErrorListComponent;
};

export type ApolloFormProps<T> = {
    // tslint:disable-next-line:no-any
    data: any;
    title?: string;
    subTitle?: string;
    config: ApolloFormConfig & { mutation: { name: T } };
    onSave?: (data: object) => void;
    onCancel?: () => void;
    ui?: UiSchema & ApolloFormUi;
    children?: React.SFC<ApolloRenderProps>;
    liveValidate?: boolean;
};

export interface ApolloFormState {
    isDirty: boolean;
    isSaved: boolean;
    hasError: boolean;
    schema: JSONSchema6;
    // tslint:disable-next-line:no-any
    data: any;
}

export interface ApolloRenderProps {
    // renderers
    header: () => React.ReactNode;
    form: () => React.ReactNode;
    buttons: () => React.ReactNode;
    saveButton: () => React.ReactNode;
    cancelButton: () => React.ReactNode;
    // actions
    cancel: () => void;
    // tslint:disable-next-line:no-any
    save: (args: any) => void;
    // state
    isDirty: boolean;
    isSaved: boolean;
    hasError: boolean;
    // tslint:disable-next-line:no-any
    data: any;
}

export interface ApolloFormTheme {
    templates: {
        FieldTemplate?: React.StatelessComponent<FieldTemplateProps>;
        ArrayFieldTemplate?: React.StatelessComponent<ArrayFieldTemplateProps>;
        ObjectFieldTemplate?: React.StatelessComponent<ObjectFieldTemplateProps>;
    };
    // tslint:disable-next-line:no-any
    widgets: { [k: string]: any };
    // tslint:disable-next-line:no-any
    fields: { [k: string]: any };
    renderers: {
        header: React.SFC<TitleRendererProps>;
        buttons: React.SFC<ButtonsRendererProps>;
        saveButton: React.SFC<SaveButtonRendererProps>;
        cancelButton: React.SFC<CancelButtonRendererProps>;
    };
}

export interface ApolloFormConfigureTheme {
    templates?: ApolloFormTheme['templates'];
    widgets?: ApolloFormTheme['widgets'];
    fields?: ApolloFormTheme['fields'];
    renderers?: Partial<ApolloFormTheme['renderers']>;
}

export interface ApolloFormConfigureOptions {
    // tslint:disable-next-line:no-any
    client: ApolloClient<any>;
    theme?: ApolloFormConfigureTheme;
    jsonSchema: JSONSchema6;
    i18n?: (key: string) => string;
}

export const getTheme = (theme?: ApolloFormConfigureTheme): ApolloFormTheme => ({
    templates: theme && theme.templates ? theme.templates : {},
    fields: theme && theme.fields ? theme.fields : {},
    widgets: theme && theme.widgets ? theme.widgets : {},
    renderers: {
        buttons: theme && theme.renderers && theme.renderers.buttons ? theme.renderers.buttons : buttonsRenderer,
        cancelButton: theme && theme.renderers && theme.renderers.cancelButton ?
            theme.renderers.cancelButton : cancelButtonRenderer,
        saveButton: theme && theme.renderers && theme.renderers.saveButton ?
            theme.renderers.saveButton : saveButtonRenderer,
        header: theme && theme.renderers && theme.renderers.header ? theme.renderers.header : titleRenderer,
    }
});

export function configure<MutationNamesType = {}>(opts: ApolloFormConfigureOptions) {
    const jsonSchema: JSONSchema6 = opts.jsonSchema;
    const theme = getTheme(opts.theme);
    return class ApolloForm extends React.Component<ApolloFormProps<MutationNamesType>, ApolloFormState> {

        submitBtn!: HTMLInputElement | null;

        state: ApolloFormState = {
            isDirty: false,
            isSaved: false,
            hasError: false,
            schema: {},
            data: {}
        };

        componentDidMount() {
            this.setState(() => ({
                schema: getSchemaFromConfig(jsonSchema, this.props.config, this.props.title),
                data: this.props.data
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
                        this.setState({
                            schema: getSchemaFromConfig(jsonSchema, config, this.props.title)
                        });
                    }
                } else {
                    this.setState({
                        schema: getSchemaFromConfig(jsonSchema, config, this.props.title)
                    });
                }
            }
        }

        // build save handler for <Form> component
        // tslint:disable-next-line:no-any
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
                    transformErrors={transformErrors}
                    config={this.props.config}
                    ui={this.props.ui}
                    liveValidate={this.props.liveValidate}
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
            const children = props.children as ApolloFormProps<MutationNamesType>['children'];
            return (
                children ?
                    children(this.childrenProps()) :
                    this.renderLayout()
            );
        }
    };
}

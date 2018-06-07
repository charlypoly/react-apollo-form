import { JSONSchema6 } from 'json-schema';
import * as React from 'react';
import Form, {
    ArrayFieldTemplateProps,
    FieldTemplateProps,
    ObjectFieldTemplateProps,
    UiSchema
} from 'react-jsonschema-form';
import { ApolloFormConfigureTheme, ApolloFormUi } from './component';
import {
    isMutationConfig,
    isTruthyWithDefault,
    ApolloFormConfig,
    ReactJsonschemaFormError
} from './utils';

// Theming types and utils

export type ErrorListComponent = React.SFC<{
    errors: ReactJsonschemaFormError[];
    errorSchema: object;
    schema: object;
    uiSchema: UiSchema;
    formContext: object;
}>;

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

// return a theme with defaults
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

// Those are all default renderers
//  See: https://github.com/wittydeveloper/react-apollo-form/wiki/Theming

export interface TitleRendererProps { title: string; }
export const titleRenderer = ({ title }: TitleRendererProps) => (
    <h2>{title}</h2>
);

export interface SaveButtonRendererProps {
    save?: () => void;
    isSaved: boolean;
    hasError: boolean;
    isDirty: boolean;
}

export const saveButtonRenderer = (props: SaveButtonRendererProps) => (
    <button
        disabled={!!props.hasError || !props.isDirty}
        onClick={props.save}
    >
        {
            props.isSaved ?
                'Saved' :
                'Save'
        }
    </button>
);

export interface CancelButtonRendererProps { cancel?: () => void; }
export const cancelButtonRenderer = (props: CancelButtonRendererProps) => (
    <button
        type="button"
        onClick={props.cancel}
    >
        Close
    </button>
);

export interface ButtonsRendererProps {
    cancel?: () => void;
    save?: () => void;
    saveButtonRenderer: React.SFC<SaveButtonRendererProps>;
    cancelButtonRenderer: React.SFC<CancelButtonRendererProps>;
    isSaved: boolean;
    hasError: boolean;
    isDirty: boolean;
}
export const buttonsRenderer = (props: ButtonsRendererProps) => (
    <div>
        {props.cancelButtonRenderer({ cancel: props.cancel })}
        {
            props.saveButtonRenderer({
                save: props.save,
                isSaved: props.isSaved,
                isDirty: props.isDirty,
                hasError: props.hasError
            })
        }
    </div>
);

export interface FormRendererProps {
    theme: ApolloFormTheme;
    // tslint:disable-next-line:no-any
    onChange: (data: any) => void;
    // tslint:disable-next-line:no-any
    save: (data: any) => void;
    // tslint:disable-next-line:no-any
    config: ApolloFormConfig;
    schema: JSONSchema6;
    data: object;
    isDirty: boolean;
    ui?: UiSchema & ApolloFormUi;
    subTitle?: string;
    liveValidate?: boolean;
    // tslint:disable-next-line:no-any
    transformErrors?: any;
}

export interface FormContext {
    subTitle?: string;
    isDirty: boolean;
    showErrorsInline: boolean;
    formPrefix: string;
}

// react-jsonschema-form is wrapper by a renderer
//  submit button is delegated to saveButtonRenderer via simulated event.
export class FormRenderer extends React.Component<FormRendererProps> {
    render() {
        const { props } = this;
        const formContext: FormContext = {
            subTitle: props.subTitle,
            isDirty: props.isDirty,
            showErrorsInline: isTruthyWithDefault(props.ui ? props.ui.showErrorsInline : true, true),
            formPrefix: props.config.name ?
                props.config.name :
                isMutationConfig(props.config) ?
                    props.config.mutation.name :
                    props.config.name!
        };
        return (
            <Form
                liveValidate={isTruthyWithDefault(props.liveValidate, false)}
                schema={props.schema}
                uiSchema={props.ui || {}}
                widgets={props.theme.widgets}
                formContext={formContext}
                fields={props.theme.fields}
                formData={props.data}
                onSubmit={props.save}
                onChange={props.onChange}
                ArrayFieldTemplate={props.theme.templates.ArrayFieldTemplate}
                FieldTemplate={props.theme.templates.FieldTemplate}
                ObjectFieldTemplate={props.theme.templates.ObjectFieldTemplate}
                showErrorList={isTruthyWithDefault(props.ui ? props.ui.showErrorsList : false, false)}
                // tslint:disable-next-line:no-any
                {...{ ErrorList: props.ui ? props.ui.errorListComponent : undefined } as any}
                transformErrors={
                    props.transformErrors ?
                        props.transformErrors(formContext.formPrefix) :
                        undefined
                }
            >
                {this.props.children}
            </Form>
        );
    }
}

import { JSONSchema6 } from 'json-schema';
import * as React from 'react';
import Form, { UiSchema } from 'react-jsonschema-form';
import { ApolloFormTheme, ApolloFormUi } from './component';
import { isMutationConfig, isTruthyWithDefault, ApolloFormConfig } from './utils';

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
    transformErrors: any;
    config: ApolloFormConfig;
    schema: JSONSchema6;
    data: object;
    isDirty: boolean;
    ui?: UiSchema & ApolloFormUi;
    subTitle?: string;
    liveValidate?: boolean;
}

export interface FormContext {
    subTitle?: string;
    isDirty: boolean;
    showErrorsInline: boolean;
    formPrefix: string;
}

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
                    props.transformErrors(formContext.formPrefix)
                }
            >
                {this.props.children}
            </Form>
        );
    }
}

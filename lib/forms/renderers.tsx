import * as React from 'react';
import * as cx from 'classnames';
import { FormHeader } from '../../common-components/app/FormHeader';
import PanelFooter from '../../common-components/forms/PanelFooter';
import Button from '../../common-components/buttons/Button';
import { reduxStore } from '../../store';
import { structureActions } from '../../redux/redux.structure';
import Form, { Widget, Field, UiSchema } from 'react-jsonschema-form';
import { isMutationConfig, AlineFormConfig } from './utils';
import { isTruthyWithDefault } from '../../routes/core/utils';
import { AlineFormUi } from './component';
import { AlineFieldTemplate } from './fields/FieldTemplate';
import { ArrayFieldTemplate } from './fields/ArrayFieldTemplate';
import { JSONSchema6 } from 'json-schema';
import * as formStyles from '../../modules/module/views/ModuleViewForm.css';

export const titleRenderer = ({ title }: { title: string }) => (
    <h2>{title}</h2>
);

export interface SaveButtonRendererProps {
    save?: () => void;
    isSaved: boolean;
    hasError: boolean;
    isDirty: boolean;
}

export const saveButtonRenderer = (props: SaveButtonRendererProps) => (
    <Button
        type="button"
        value={
            props.isSaved ?
                t('Forms.MilestoneForm.Panel.Saved') :
                t('CommunityList.CreateForm.save')
        }
        iconClass={props.isSaved ? 'check' : undefined}
        disabled={!!props.hasError || !props.isDirty}
        takeFullWidth={true}
        className={cx(
            formStyles.formButtonsSubmit,
            formStyles.formButtonsButton,
            { [formStyles.formButtonsSubmitSaved]: props.isSaved }
        )}
        onClick={props.save}
    />
);

export const cancelButtonRenderer = (props: { cancel?: () => void; }) => (
    <Button
        type="button"
        value="Fermer"
        takeFullWidth={true}
        onClick={props.cancel}
        className={formStyles.formButtonsCancel}
    />
);

export interface ButtonsRendererProps {
    cancel?: () => void;
    save?: () => void;
    isSaved: boolean;
    hasError: boolean;
    isDirty: boolean;
}
export const buttonsRenderer = (props: ButtonsRendererProps) => (
    <PanelFooter className={formStyles.formButtonsContainer}>
        {cancelButtonRenderer({ cancel: props.cancel })}
        {
            saveButtonRenderer({
                save: props.save,
                isSaved: props.isSaved,
                isDirty: props.isDirty,
                hasError: props.hasError
            })
        }
    </PanelFooter>
);

export interface FormRendererProps {
    widgets: object;
    fields: object;
    // tslint:disable-next-line:no-any
    onChange: (data: any) => void;
    // tslint:disable-next-line:no-any
    save: (data: any) => void;
    // tslint:disable-next-line:no-any
    transformErrors: any;
    config: AlineFormConfig;
    schema: JSONSchema6;
    data: object;
    isDirty: boolean;
    ui?: UiSchema & AlineFormUi;
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
                className={formStyles.form}
                schema={props.schema}
                uiSchema={props.ui || {}}
                widgets={props.widgets}
                formContext={formContext}
                fields={props.fields}
                formData={props.data}
                onSubmit={props.save}
                onChange={props.onChange}
                ArrayFieldTemplate={ArrayFieldTemplate}
                FieldTemplate={AlineFieldTemplate}
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

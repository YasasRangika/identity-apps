/**
 * Copyright (c) 2020, WSO2 Inc. (http://www.wso2.org) All Rights Reserved.
 *
 * WSO2 Inc. licenses this file to you under the Apache License,
 * Version 2.0 (the "License"); you may not use this file except
 * in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied. See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import { Heading, LinkButton, PrimaryButton, Steps } from "@wso2is/react-components";
import _ from "lodash";
import React, { FunctionComponent, ReactElement, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";
import { Grid, Icon, Modal } from "semantic-ui-react";
import { addUser, addUserRole, getGravatarImage, getRolesList } from "../../../api";
import { UserWizardStepIcons } from "../../../configs";
import { AlertLevels } from "../../../models";
import { addAlert } from "../../../store/actions";
import { AddUser } from "../add-user";
import { AddUserWizardSummary } from "./wizard-summary";
import { useTrigger } from "@wso2is/forms";
import { AddUserRole } from "../add-user-role";
import { AddUserGroup } from "../add-user-groups";
import {
    RolesInterface,
    AddUserWizardStateInterface,
    UserDetailsInterface,
    createEmptyUserDetails
} from "../../../models";
import { RolePermissions } from "./user-role-permissions";

interface AddUserWizardPropsInterface {
    closeWizard: () => void;
    currentStep?: number;
    listOffset: number;
    listItemLimit: number;
    updateList: () => void;
    rolesList: any;
}

/**
 * Interface for the wizard state.
 */
interface WizardStateInterface {
    [ key: string ]: any;
}

/**
 * Enum for wizard steps form types.
 * @readonly
 * @enum {string}
 */
enum WizardStepsFormTypes {
    BASIC_DETAILS = "BasicDetails",
    ROLE_LIST= "RoleList",
    GROUP_LIST= "GroupList",
    SUMMARY = "summary"
}

/**
 * User creation wizard.
 *
 * @return {JSX.Element}
 */
export const AddUserWizard: FunctionComponent<AddUserWizardPropsInterface> = (
    props: AddUserWizardPropsInterface
): ReactElement => {

    const {
        updateList,
        closeWizard,
        currentStep,
    } = props;

    const { t } = useTranslation();
    const dispatch = useDispatch();

    const [ submitGeneralSettings, setSubmitGeneralSettings ] = useTrigger();
    const [ submitRoleList, setSubmitRoleList ] = useTrigger();
    const [ submitGroupList, setSubmitGroupList ] = useTrigger();
    const [ finishSubmit, setFinishSubmit ] = useTrigger();

    const [ partiallyCompletedStep, setPartiallyCompletedStep ] = useState<number>(undefined);
    const [ currentWizardStep, setCurrentWizardStep ] = useState<number>(currentStep);
    const [ wizardState, setWizardState ] = useState<WizardStateInterface>(undefined);

    const [ roleList, setRoleList ] = useState<RolesInterface[]>([]);
    const [ tempRoleList, setTempRoleList ] = useState<RolesInterface[]>([]);
    const [ initialRoleList, setInitialRoleList ] = useState<RolesInterface[]>([]);
    const [ initialTempRoleList, setInitialTempRoleList ] = useState<RolesInterface[]>([]);

    const [ groupList, setGroupsList ] = useState<RolesInterface[]>([]);
    const [ tempGroupList, setTempGroupList ] = useState<RolesInterface[]>([]);
    const [ initialGroupList, setInitialGroupList ] = useState<RolesInterface[]>([]);
    const [ initialTempGroupList, setInitialTempGroupList ] = useState<RolesInterface[]>([]);

    const [ applicationRoles, setApplicationRoles ] = useState<RolesInterface[]>([]);
    const [ internalRoles, setInternalRoles ] = useState<RolesInterface[]>([]);
    const [ isInternalRolesSet, setIsInternalRolesSet ] = useState<boolean>(false);
    const [ isApplicationRolesSet, setIsApplicationRolesSet ] = useState<boolean>(false);

    const [ viewGroupPermissions, setViewGroupPermissions ] = useState<boolean>(false);
    const [ selectedGroupId, setSelectedGroupId ] = useState<string>();
    const [ isGroupSelected, setGroupSelection ] = useState<boolean>(false);

    const [ viewRolePermissions, setViewRolePermissions ] = useState<boolean>(false);
    const [ selectedRoleId,  setSelectedRoleId ] = useState<string>();
    const [ isRoleSelected, setRoleSelection ] = useState<boolean>(false);

    const [ userGravatarUrl, setUserGravatarUrl ] = useState<string>("");

    useEffect(() => {
        if (!wizardState) {
            return;
        }

        if (wizardState[ WizardStepsFormTypes.BASIC_DETAILS ]?.email) {
            getGravatarImage(wizardState[ WizardStepsFormTypes.BASIC_DETAILS ]?.email)
                .then((response) => {
                    setUserGravatarUrl(response);
                });
        }
    }, [ wizardState && wizardState[ WizardStepsFormTypes.BASIC_DETAILS ]?.email ]);

    useEffect(() => {
        if (!selectedGroupId) {
            return;
        }

        if (isGroupSelected) {
            setViewGroupPermissions(true);
        }
    }, [ isGroupSelected ]);

    useEffect(() => {
        if (!selectedRoleId) {
            return;
        }

        if (isRoleSelected) {
            setViewRolePermissions(true);
        }
    }, [ isRoleSelected ]);

    useEffect(() => {
        if (applicationRoles.length === 0) {
            getRolesList("Application")
                .then((response) => {
                    setApplicationRoles(response.data.Resources);
                    setIsApplicationRolesSet(true);
                });
        }

    }, []);

    useEffect(() => {
        if (internalRoles.length === 0) {
            getRolesList("Internal")
                .then((response) => {
                    setInternalRoles(response.data.Resources);
                    setIsInternalRolesSet(true);
                });
        }
    }, []);

    useEffect(() => {
        if (internalRoles.length > 0 && applicationRoles.length > 0) {
            setRoleList(_.concat(applicationRoles, internalRoles));
            setInitialRoleList(_.concat(applicationRoles, internalRoles));
        }
    }, [ isInternalRolesSet, isApplicationRolesSet ]);

    /**
     * Sets the current wizard step to the previous on every `partiallyCompletedStep`
     * value change , and resets the partially completed step value.
     */
    useEffect(() => {
        if (partiallyCompletedStep === undefined) {
            return;
        }

        setCurrentWizardStep(currentWizardStep - 1);
        setPartiallyCompletedStep(undefined);
    }, [ partiallyCompletedStep ]);

    useEffect(() => {
        if ( wizardState && wizardState[ WizardStepsFormTypes.BASIC_DETAILS ]?.domain) {
            getGroupListForDomain(wizardState && wizardState[ WizardStepsFormTypes.BASIC_DETAILS ]?.domain);
        }
    }, [ wizardState && wizardState[ WizardStepsFormTypes.BASIC_DETAILS ]?.domain ]);

    const getGroupListForDomain = (domain: string) => {
        getRolesList(domain)
            .then((response) => {
                setGroupsList(response.data.Resources);
                setInitialGroupList(response.data.Resources);
            });
    };

    const handleViewGroupPermission = () => {
        setViewGroupPermissions(!viewGroupPermissions);
        setGroupSelection(false);
    };

    const handleGroupIdSet = (groupId) => {
        setSelectedGroupId(groupId);
        setGroupSelection(true);
    };

    const handleViewRolePermission = () => {
        setViewRolePermissions(!viewRolePermissions);
        setRoleSelection(false);
    };

    const handleRoleIdSet = (roleId) => {
        setSelectedRoleId(roleId);
        setRoleSelection(true);
    };

    const handleRoleListChange = (roleList) => {
        setRoleList(roleList);
    };

    const handleInitialRoleListChange = (roleList) => {
        setInitialRoleList(roleList);
    };

    const handleAddedListChange = (newRoleList) => {
        setTempRoleList(newRoleList);
    };

    const handleAddedRoleInitialListChange = (newRoleList) => {
        setInitialTempRoleList(newRoleList);
    };

    const handleGroupListChange = (groupList) => {
        setGroupsList(groupList);
    };

    const handleInitialGroupListChange = (groupList) => {
        setInitialGroupList(groupList);
    };

    const handleAddedGroupListChange = (newGroupList) => {
        setTempGroupList(newGroupList);
    };

    const handleAddedGroupInitialListChange = (newGroupList) => {
        setInitialTempGroupList(newGroupList);
    };

    const navigateToNext = () => {
        switch (currentWizardStep) {
            case 0:
                setSubmitGeneralSettings();
                break;
            case 1:
                setSubmitGroupList();
                break;
            case 2:
                setSubmitRoleList();
                break;
            case 3:
                setFinishSubmit();
        }
    };

    const navigateToPrevious = () => {
        setPartiallyCompletedStep(currentWizardStep);
    };

    /**
     * This function handles assigning the roles to the user.
     */
    const assignUserRole = (user: any, roles: any, groups: any) => {
        const roleIds = [];
        const groupIds = [];

        const data = {
            Operations: [
                {
                    op: "add",
                    value: {
                        members: [
                            {
                                display: user.userName,
                                value: user.id
                            }
                        ]
                    }
                }
            ],
            schemas: ["urn:ietf:params:scim:api:messages:2.0:PatchOp"],
        };

        if (roles.length > 0) {
            roles.map((role) => {
                roleIds.push(role.id);
            });

            for (const roleId of roleIds) {
                addUserRole(data, roleId)
                    .catch((error) => {
                        if (!error.response || error.response.status === 401) {
                            dispatch(addAlert({
                                description: t(
                                    "devPortal:components.users.notifications.addUser.error.description"
                                ),
                                level: AlertLevels.ERROR,
                                message: t(
                                    "devPortal:components.users.notifications.addUser.error.message"
                                )
                            }));
                        } else if (error.response && error.response.data && error.response.data.detail) {

                            dispatch(addAlert({
                                description: t(
                                    "devPortal:components.users.notifications.addUser.error.description",
                                    { description: error.response.data.detail }
                                ),
                                level: AlertLevels.ERROR,
                                message: t(
                                    "devPortal:components.users.notifications.addUser.error.message"
                                )
                            }));
                        } else {
                            // Generic error message
                            dispatch(addAlert({
                                description: t(
                                    "devPortal:components.users.notifications.addUser.genericError.description"
                                ),
                                level: AlertLevels.ERROR,
                                message: t(
                                    "devPortal:components.users.notifications.addUser.genericError.message"
                                )
                            }));
                        }
                    });
            }
        }

        if (groups.length > 0) {
            groups.map((group) => {
                groupIds.push(group.id);
            });

            for (const groupId of groupIds) {
                addUserRole(data, groupId)
                    .catch((error) => {
                        if (!error.response || error.response.status === 401) {
                            dispatch(addAlert({
                                description: t(
                                    "devPortal:components.users.notifications.addUser.error.description"
                                ),
                                level: AlertLevels.ERROR,
                                message: t(
                                    "devPortal:components.users.notifications.addUser.error.message"
                                )
                            }));
                        } else if (error.response && error.response.data && error.response.data.detail) {

                            dispatch(addAlert({
                                description: t(
                                    "devPortal:components.users.notifications.addUser.error.description",
                                    { description: error.response.data.detail }
                                ),
                                level: AlertLevels.ERROR,
                                message: t(
                                    "devPortal:components.users.notifications.addUser.error.message"
                                )
                            }));
                        } else {
                            // Generic error message
                            dispatch(addAlert({
                                description: t(
                                    "devPortal:components.users.notifications.addUser.genericError.description"
                                ),
                                level: AlertLevels.ERROR,
                                message: t(
                                    "devPortal:components.users.notifications.addUser.genericError.message"
                                )
                            }));
                        }
                    });
            }
        }
    };
    
    /**
     * This function handles adding the user.
     */
    const addUserBasic = (userInfo: AddUserWizardStateInterface) => {
        let userName = "";
        let profileUrl = "";
        userInfo.domain !== "primary" ? userName = userInfo.domain + "/" + userInfo.userName : userName =
            userInfo.userName;
        let userDetails: UserDetailsInterface = createEmptyUserDetails();
        const password = userInfo.newPassword;

        if (userGravatarUrl) {
            profileUrl = userGravatarUrl;
        }

        userInfo.passwordOption && userInfo.passwordOption !== "askPw" ?
            (
                userDetails = {
                    emails:
                        [{
                            primary: true,
                            value: userInfo.email
                        }],
                    name:
                        {
                            familyName: userInfo.lastName,
                            givenName: userInfo.firstName
                        },
                    profileUrl,
                    password,
                    userName
                }
            ) :
            (
                userDetails = {
                    emails:
                        [{
                            primary: true,
                            value: userInfo.email
                        }],
                    name:
                        {
                            familyName: userInfo.lastName,
                            givenName: userInfo.firstName
                        },
                    password: "password",
                    "urn:ietf:params:scim:schemas:extension:enterprise:2.0:User":
                        {
                            askPassword: "true"
                        },
                    userName,
                    profileUrl
                }
            );

        addUser(userDetails)
            .then((response) => {
                dispatch(addAlert({
                    description: t(
                        "devPortal:components.users.notifications.addUser.success.description"
                    ),
                    level: AlertLevels.SUCCESS,
                    message: t(
                        "devPortal:components.users.notifications.addUser.success.message"
                    )
                }));

                if (wizardState?.RoleList?.roles && wizardState?.GroupList?.groups) {
                    assignUserRole(response.data, wizardState.RoleList.roles, wizardState.GroupList.groups)
                }

                updateList();
                closeWizard();
            })
            .catch((error) => {
                // Axios throws a generic `Network Error` for 401 status.
                // As a temporary solution, a check to see if a response
                // is available has be used.
                if (!error.response || error.response.status === 401) {
                    dispatch(addAlert({
                        description: t(
                            "devPortal:components.users.notifications.addUser.error.description"
                        ),
                        level: AlertLevels.ERROR,
                        message: t(
                            "devPortal:components.users.notifications.addUser.error.message"
                        )
                    }));
                } else if (error.response && error.response.data && error.response.data.detail) {

                    dispatch(addAlert({
                        description: t(
                            "devPortal:components.users.notifications.addUser.error.description",
                            { description: error.response.data.detail }
                        ),
                        level: AlertLevels.ERROR,
                        message: t(
                            "devPortal:components.users.notifications.addUser.error.message"
                        )
                    }));
                } else {
                    // Generic error message
                    dispatch(addAlert({
                        description: t(
                            "devPortal:components.users.notifications.addUser.genericError.description"
                        ),
                        level: AlertLevels.ERROR,
                        message: t(
                            "devPortal:components.users.notifications.addUser.genericError.message"
                        )
                    }));
                }
            });
    };

    /**
     * Handles wizard step submit.
     *
     * @param values - Forms values to be stored in state.
     * @param {WizardStepsFormTypes} formType - Type of the form.
     */
    const handleWizardFormSubmit = (values: any, formType: WizardStepsFormTypes) => {
        setCurrentWizardStep(currentWizardStep + 1);
        setWizardState({ ...wizardState, [ formType ]: values });
    };

    /**
     * Generates a summary of the wizard.
     *
     * @return {any}
     */
    const generateWizardSummary = () => {
        if (!wizardState) {
            return;
        }

        let wizardData: WizardStateInterface = { ...wizardState };

        if (wizardState[ WizardStepsFormTypes.BASIC_DETAILS ] &&
            !(wizardState[ WizardStepsFormTypes.BASIC_DETAILS ].profileUrl) && userGravatarUrl) {
            wizardData = {
                ...wizardState,
                BasicDetails: {
                    ...wizardState.BasicDetails,
                    profileUrl: userGravatarUrl
                }
            }
        }

        let summary = {};

        for (const value of Object.values(wizardData)) {
            summary = {
                ...summary,
                ...value
            };
        }

        return _.merge(_.cloneDeep(summary));
    };

    const handleWizardFormFinish = (user: AddUserWizardStateInterface) => {
        addUserBasic(user);
    };

    const STEPS = [
        {
            content: (
                <AddUser
                    triggerSubmit={ submitGeneralSettings }
                    initialValues={ wizardState && wizardState[ WizardStepsFormTypes.BASIC_DETAILS ] }
                    onSubmit={ (values) => handleWizardFormSubmit(values, WizardStepsFormTypes.BASIC_DETAILS) }
                />
            ),
            icon: UserWizardStepIcons.general,
            title: t("devPortal:components.user.modals.addUserWizard.steps.basicDetails")
        },
        {
            content: (
                viewGroupPermissions
                     ? <RolePermissions handleNavigateBack={ handleViewGroupPermission } roleId={ selectedGroupId } />
                     : <AddUserGroup
                            triggerSubmit={ submitGroupList }
                            onSubmit={ (values) => handleWizardFormSubmit(values, WizardStepsFormTypes.GROUP_LIST) }
                            initialValues={
                                {
                                    initialGroupList: initialGroupList,
                                    groupList: groupList,
                                    tempGroupList: tempGroupList,
                                    initialTempGroupList: initialTempGroupList
                                }
                            }
                            handleGroupListChange={ (groups) => handleGroupListChange(groups) }
                            handleTempListChange={ (groups) => handleAddedGroupListChange(groups) }
                            handleInitialTempListChange={ (groups) => handleAddedGroupInitialListChange(groups) }
                            handleInitialGroupListChange={ (groups) => handleInitialGroupListChange(groups) }
                            handleSetGroupId={ (groupId) => handleGroupIdSet(groupId) }
                        />
            ),
            icon: UserWizardStepIcons.groups,
            title: t("devPortal:components.user.modals.addUserWizard.steps.groups")
        },
        {
            content: (
                viewRolePermissions
                ? <RolePermissions handleNavigateBack={ handleViewRolePermission } roleId={ selectedRoleId } />
                : <AddUserRole
                        triggerSubmit={ submitRoleList }
                        onSubmit={ (values) => handleWizardFormSubmit(values, WizardStepsFormTypes.ROLE_LIST) }
                        initialValues={
                            {
                                initialRoleList: initialRoleList,
                                roleList: roleList,
                                tempRoleList: tempRoleList,
                                initialTempRoleList: initialTempRoleList
                            }
                        }
                        handleRoleListChange={ (roles) => handleRoleListChange(roles) }
                        handleTempListChange={ (roles) => handleAddedListChange(roles) }
                        handleInitialTempListChange={ (roles) => handleAddedRoleInitialListChange(roles) }
                        handleInitialRoleListChange={ (roles) => handleInitialRoleListChange(roles) }
                        handleSetRoleId={ (roleId) => handleRoleIdSet(roleId) }
                    />
            ),
            icon: UserWizardStepIcons.roles,
            title: t("devPortal:components.user.modals.addUserWizard.steps.roles")
        },
        {
            content: (
                <AddUserWizardSummary
                    triggerSubmit={ finishSubmit }
                    onSubmit={ handleWizardFormFinish }
                    summary={ generateWizardSummary() }
                />
            ),
            icon: UserWizardStepIcons.summary,
            title: t("devPortal:components.user.modals.addUserWizard.steps.summary")
        }
    ];

    return (
        <Modal
            open={ true }
            className="wizard application-create-wizard"
            dimmer="blurring"
            size="small"
            onClose={ closeWizard }
            closeOnDimmerClick
            closeOnEscape
        >
            <Modal.Header className="wizard-header">
                { t("devPortal:components.user.modals.addUserWizard.title") }
                <Heading as="h6">{ t("devPortal:components.user.modals.addUserWizard.subTitle") }</Heading>
            </Modal.Header>
            <Modal.Content className="steps-container">
                <Steps.Group
                    header={ t("devPortal:components.user.modals.addUserWizard.steps.title") }
                    current={ currentWizardStep }
                >
                    { STEPS.map((step, index) => (
                        <Steps.Step
                            key={ index }
                            icon={ step.icon }
                            title={ step.title }
                        />
                    )) }
                </Steps.Group>
            </Modal.Content>
            <Modal.Content className="content-container" scrolling>
                { STEPS[ currentWizardStep ].content }
            </Modal.Content>
            <Modal.Actions>
                <Grid>
                    <Grid.Row column={ 1 }>
                        <Grid.Column mobile={ 8 } tablet={ 8 } computer={ 8 }>
                            <LinkButton floated="left" onClick={ () => closeWizard() }>
                                { t("common:cancel") }
                            </LinkButton>
                        </Grid.Column>
                        <Grid.Column mobile={ 8 } tablet={ 8 } computer={ 8 }>
                            { currentWizardStep < STEPS.length - 1 && (
                                <PrimaryButton floated="right" onClick={ navigateToNext }>
                                    { t("devPortal:components.user.modals.addUserWizard.buttons.next") }
                                    <Icon name="arrow right"/>
                                </PrimaryButton>
                            ) }
                            { currentWizardStep === STEPS.length - 1 && (
                                <PrimaryButton floated="right" onClick={ navigateToNext }>
                                    Finish</PrimaryButton>
                            ) }
                            { currentWizardStep > 0 && (
                                <LinkButton floated="right" onClick={ navigateToPrevious }>
                                    <Icon name="arrow left"/>
                                    { t("devPortal:components.user.modals.addUserWizard.buttons.previous") }
                                </LinkButton>
                            ) }
                        </Grid.Column>
                    </Grid.Row>
                </Grid>
            </Modal.Actions>
        </Modal>
    );
};

/**
 * Default props for the add user wizard.
 */
AddUserWizard.defaultProps = {
    currentStep: 0
};

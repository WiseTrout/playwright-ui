export default function getGlobalSettingsToDisplay(globalSettings){

    const COMPLEX_INPUT_TYPES = ['select', 'checkbox', 'radio'];

    return globalSettings.map(setting => {
        const newSetting = {... setting};
        if(setting.options) newSetting.options = setting.options.map(option => ({...option, type: setting.type, name: 'global--' + setting.name}));
        for(const type of COMPLEX_INPUT_TYPES){
            if(setting.type === type) newSetting['is' + type[0].toUpperCase() + type.slice(1)] = true;
        }
        newSetting.isSimple = !COMPLEX_INPUT_TYPES.includes(setting.type);
        newSetting.name = 'global--' + setting.name;
        return newSetting;
    });
}
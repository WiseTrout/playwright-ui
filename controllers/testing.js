export function getMenu(_, res){
     const menuCategories = testSuites.map(suite => {
        const {title, categories, machineName} = suite;
        return {
            title,
            categories: categories.map(cat => ({
                title: cat.title,
                inputName: machineName + `--category--` + cat.title
            }))
        }
    })

    const menuBrowsers = availableBrowsers.map(browser => ({
        name: browser,
        defaultChecked: appSettings.defaultBrowsersToUse.includes(browser)
    }))

    const globalSettings = getGlobalSettingsToDisplay(appSettings.globalSettings);

    res.render('index', {
        title: appSettings.applicationName, 
        globalSettings,
        testSuites: menuCategories, 
        browsers: menuBrowsers
    });
}

export function runTests(req, res){
    
}

export function getTestsUpdate(req, res){

}

export function stopTests(req, res){}
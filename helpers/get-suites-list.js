export default function getSuitesList(suitesMetadata, testFiles){
    const suitesInfo = suitesMetadata.map(metadata => {
        const suiteInfo = {...metadata, categories: []};

        for(const fileName of metadata.testFiles){
            
            const fileInfo = testFiles.find(test => test.file === fileName);
            if(!fileInfo) throw new Error(`Test file ${fileName} not found`);

            const fileTestCategories = fileInfo.suites.map(testGroup => ({
                title: testGroup.title,
                tests: testGroup.specs.map(test => test.title)
            }))
            
            suiteInfo.categories = suiteInfo.categories.concat(fileTestCategories);


        }
         return suiteInfo;
    });

    return suitesInfo;
}
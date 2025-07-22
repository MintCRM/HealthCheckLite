public with sharing class mintHealthCheckLite {
    @AuraEnabled(cacheable=true)
    public static List<OrgMetric> getOrgMetrics() {
        return [
            SELECT Id, FeatureType, Category, Name,
                (SELECT Id, Name, OrgMetricId, Status, ErrorMessage, ItemCount, FeatureLimit, Unit, PercentUsage, ImplementationEffort, ScanDate, 
                    (SELECT Id, Name, Object, Quantity, ItemStatus, User, Type 
                        FROM OrgMetricScanSummary 
                        ORDER BY Object ASC) 
                FROM OrgMetric 
                ORDER BY ScanDate DESC 
                LIMIT 1) 
            FROM OrgMetric
            ORDER BY Category ASC
        ];
    }

    @AuraEnabled(cacheable=true)
    public static Map<String, sObject> getOrgMetricsFeatureTypeMap() {
        Map<String, sObject> featureTypeMap = new Map<String, sObject>();

        List<Health_Check_Org_Metric_Feature_Type__mdt> featureTypes = [
            SELECT Label, mint__Formatted_Name__c, mint__Recommendation_Text__c, mint__Result_Text__c
            FROM Health_Check_Org_Metric_Feature_Type__mdt
        ];

        for (Health_Check_Org_Metric_Feature_Type__mdt featureType : featureTypes) {
            featureTypeMap.put(featureType.Label, featureType);
        }

        return featureTypeMap;
    }

    @AuraEnabled(cacheable=true)
    public static Organization getOrgDetails() {
        return [SELECT Id, Name FROM Organization LIMIT 1];
    }
}
public class MintHistoryTrackingTriggerManager implements Queueable, Database.AllowsCallouts {
    String objectAPI;
    Id logRecordId;
    String runMode;

    public MintHistoryTrackingTriggerManager(String objectAPI, Id logRecordId, String runMode) {
        this.objectAPI = objectAPI;
        this.logRecordId = logRecordId;
        this.runMode = runMode;
    }

    public void execute(QueueableContext context) {
        try {
            if (this.runMode == 'Create Trigger') {
                MintHistoryTrackingController.createObjectTriggerAction(this.objectAPI);
                updateLog(100, 'Trigger creation complete');
            }
            else if (this.runMode == 'Remove Trigger') {
                MintHistoryTrackingController.deleteObjectTriggerAction(this.objectAPI);
                updateLog(100, 'Trigger deletion complete');
            } 
            else {
                throw new IllegalArgumentException('Invalid run mode: ' + this.runMode);
            }
        } 
        catch (Exception e) {
            updateLog(-1, 'Error: ' + e.getMessage());
        }
        // Enqueue deletion as the very last step, in a new transaction
        // System.enqueueJob(new MintHistoryTrackingTriggerLogDeleter(logRecordId));
    }

    private void updateLog(Integer progress, String message) {
        Mint_History_Tracking_Configuration__c logRec = new Mint_History_Tracking_Configuration__c(
            Id = logRecordId,
            Trigger_Progress__c = progress,
            Message__c = message
        );
        update logRec;
    }
}
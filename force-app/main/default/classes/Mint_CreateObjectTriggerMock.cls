@isTest
public class Mint_CreateObjectTriggerMock implements HttpCalloutMock {
    public HttpResponse respond(HttpRequest req) {
        System.debug('Mock HTTP callout invoked');
        
        HttpResponse res = new HttpResponse();
        
        // Handle POST (trigger creation)
        if (req.getMethod() == 'POST') {
            System.debug('Handling POST request for trigger creation');
            res.setStatusCode(201); // Simulate successful creation
            res.setBody('{"status":"Success"}'); // Simulate a valid JSON response
        }
        // Handle DELETE (trigger deletion)
        else if (req.getMethod() == 'DELETE') {
            System.debug('Handling DELETE request for trigger deletion');
            res.setStatusCode(204); // Simulate successful deletion
        }
        // Handle unsupported methods
        else {
            System.debug('Unsupported HTTP method: ' + req.getMethod());
            res.setStatusCode(400); // Bad request
            res.setBody('{"error":"Unsupported HTTP method"}');
        }
        
        return res;
    }
}
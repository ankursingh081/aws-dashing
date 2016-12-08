var AWS = require('aws-sdk');
var config = require('./config');


// configure the aws sdk
AWS.config.update(
    {
        accessKeyId: config.AWS.ACCESSKEY,
        secretAccessKey: config.AWS.SECRETKEY,
        region: 'ap-southeast-1'
    }
);


// aws services declarations
var ec2 = new AWS.EC2();
var elb = new AWS.ELB();
var s3 = new AWS.S3();
var rds = new AWS.RDS();
var elasticache = new AWS.ElastiCache();
var route53 = new AWS.Route53();

// query the aws api and expose methods for jobs
module.exports = {

    /// EC2 ///

    getEC2InstanceLimit: function (next) {
        ec2.describeAccountAttributes(function(err, data){
            if (err) return next(err, null);
            data.AccountAttributes.forEach(function(attr){
                if (attr.AttributeName === "max-instances") {
                    next(null, attr.AttributeValues[0].AttributeValue);
                }
            });
        });
    },

    getEC2Instances: function (next){
        ec2.describeInstances(function(err, data){
           // console.log(data);
            if (err) return next(err, null);
            next(null, data.Reservations);
        });
    },

    getEC2Desc: function (next){
        ec2.describeInstances(function(err, data){
           var ip=[];
            if (err) return next(err, null);
            var inst_id = '-';
        for (var i = 0; i < data.Reservations.length; i++) {
            var res = data.Reservations[i];
            var instances = res.Instances;
            for (var j = 0; j < instances.length; j++) {
                var instanceID = instances[j].InstanceId;
                var state = instances[j].State.Code;
                var public_ip = instances[j].PublicIpAddress;
                ip[i]=instances[j].PublicIpAddress;
                var imageID = instances[j].ImageId;
                console.log('instance ' + instanceID + " state " + state + " public ip " + public_ip + 'image id ' + imageID);
        }
    }
        next(null, ip);
    });

    },

    getElasticIPsLimit: function (next) {
        ec2.describeAccountAttributes(function(err, data){
            if (err) return next(err, null);
            data.AccountAttributes.forEach(function(attr){
                if (attr.AttributeName === "max-elastic-ips") {
                    next(null, attr.AttributeValues[0].AttributeValue);
                }
            });
        });
    },

    getElasticIPs: function (next) {
        ec2.describeAddresses(function(err, data) {
            if (err) return next(err, null);
            next(null, data.Addresses);
        });
    },

    getSecurityGroups: function (next) {
        ec2.describeSecurityGroups(function(err, data) {
            if (err) return next(err, null);
            next(null, data.SecurityGroups);
        });
    },

    // EBS //

    getEBSVolumes: function (next) {
        ec2.describeVolumes(function(err, data){
            if (err) return next(err, null);
            next(null, data.Volumes);
        });
    },

    getEBSSnapshots: function (next) {
        ec2.describeSnapshots(function (err, data) {
            if (err) return next(err, null);
            next(null, data.Snapshots);
        });
    },

    /// ELB ///

    getELBs: function (next) {
        elb.describeLoadBalancers(function(err, data) {
            if (err) return next(err, null);
            next(null, data.LoadBalancerDescriptions);
        });
    },

    /// S3 ///

    getS3Buckets: function (next) {
        s3.listBuckets(function(err, data) {
            if (err) return next(err, null);
            next(null, data.Buckets);
        });
    },

    getS3Objects: function (bucket_name, next) {
        var listS3Objects = function (bucket_name, index, objects, next) {
            s3.listObjects({Bucket:bucket_name, Marker:index}, function (err, data) {
                if (err) return next(err, null);
                var length = data.Contents.length
                objects += length;
                if (data.IsTruncated == true){
                    listS3Objects(bucket_name, data.Contents[length-1].Key, objects, next);
                } else {
                    next(null, objects);
                }
            })
        };
        listS3Objects(bucket_name, "", 0, next);
    },

    /// RDS ///

    getRDSInstances: function (next) {
        rds.describeDBInstances(function(err, data) {
            if (err) return next(err, null);
            next(null, data.DBInstances);
        });
    },

    /// ElastiCache ///

    getElastiCacheClusters: function (next) {
        elasticache.describeCacheClusters(function (err, data) {
            if (err) return next(err, null);
            next(null, data.CacheClusters);
        });
    },

    getElastiCacheNodes: function (next) {
        elasticache.describeReservedCacheNodes(function(err, data) {
            if (err) return next(err, null);
            next(null, data.ReservedCacheNodes);
        });
    },

    getElastiCacheSecurityGroups: function (next) {
        elasticache.describeCacheSecurityGroups(function (err, data) {
            if (err) return next(err, null);
            next(null, data.CacheSecurityGroups);
        });
    },

    /// R53 ///

    getR53HostedZones: function (next) {
        route53.listHostedZones(function(err, data) {
            if (err) return next(err, null);
            next(null, data.HostedZones);
        });
    },

    getR53RecordsSet: function (hosted_zones_id, next) {
        route53.listResourceRecordSets({HostedZoneId: hosted_zones_id}, function (err, data){
            if (err) return next(err, null);
            next(null, data.ResourceRecordSets);
        });
    },

}
/*

route53.listHostedZones(function(err, data) {
    if (err) console.log(err, err.stack);
    else console.log('hosted zones: ' + data.HostedZones.length);
    send_event('hz', {current: data.HostedZones.length })

    var records = 0
    data.HostedZones.forEach(function(hz){
        route53.listResourceRecordSets({HostedZoneId: hz.Id}, function (err, data){
            if (err) console.log(err, err.stack);
            else records += data.ResourceRecordSets.length
            send_event('record', {current: records })
        })
    });

});

*/
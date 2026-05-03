/**
 * Created by Mallikarjun on 07-06-2017.
 */
$(function() {
    $("input[type='submit']").click(function(e){
        e.preventDefault();
        var form = $('form[name="payaidpaymentsForm"]');
        var data = form.serializeObject();
        $.ajax({
            type: "POST",
            url: "/paymentRequest",
            data: JSON.stringify(data),
            contentType: 'application/json',
            dataType: 'json',
            success:function(response) {
				if(response.data == ''){
				$("div").show();
				return ;
				}else{
                $('form[name="payaidpaymentsForm"] input[name="hash"]').val(response.data);
				$('form[name="payaidpaymentsForm"]').attr("action", "https://api.payaidpayments.com/v2/paymentrequest");
                form.submit();					
				}

            },
            error :function(jqXHR, textStatus, errorThrown){
                console.log(textStatus, errorThrown)
            }
        });
    });
});
//object
$.fn.serializeObject = function()
{
    var o = {};
    var a = this.serializeArray();
    $.each(a, function() {
        if (o[this.name] !== undefined) {
            if (!o[this.name].push) {
                o[this.name] = [o[this.name]];
            }
            o[this.name].push(this.value || '');
        } else {
            o[this.name] = this.value || '';
        }
    });
    return o;
};
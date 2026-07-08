import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../main.dart';

class CustomerOrdersScreen extends StatefulWidget {
  const CustomerOrdersScreen({super.key});

  @override
  State<CustomerOrdersScreen> createState() => _CustomerOrdersScreenState();
}

class _CustomerOrdersScreenState extends State<CustomerOrdersScreen> {
  List<dynamic> _orders = [];
  bool _isLoading = true;
  int _page = 1;
  bool _hasMore = false;

  Future<void> _fetchOrders({bool reset = false}) async {
    if (reset) {
      setState(() {
        _page = 1;
        _isLoading = true;
      });
    }

    try {
      final response = await LogiRouteApp.dio.get('/orders/customer?page=$_page&limit=15');
      if (response.statusCode == 200 && response.data != null) {
        final data = response.data['data'] as List<dynamic>;
        final pagination = response.data['pagination'];
        setState(() {
          if (reset) {
            _orders = data;
          } else {
            _orders.addAll(data);
          }
          _hasMore = pagination != null ? pagination['page'] < pagination['totalPages'] : false;
        });
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to load orders: $e'), backgroundColor: Colors.red),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  @override
  void initState() {
    super.initState();
    _fetchOrders(reset: true);
  }

  Color _getStatusColor(String status) {
    switch (status) {
      case 'created':
        return Colors.blueGrey;
      case 'assigned':
      case 'accepted':
        return Colors.indigo;
      case 'picked_up':
      case 'in_transit':
        return Colors.amber[800]!;
      case 'delivered':
        return Colors.green;
      case 'failed':
        return Colors.red;
      default:
        return Colors.grey;
    }
  }

  String _formatStatus(String status) {
    return status.toUpperCase().replaceAll('_', ' ');
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: const Text('My Orders', style: TextStyle(fontWeight: FontWeight.bold)),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => context.go('/home'),
        ),
      ),
      body: RefreshIndicator(
        onRefresh: () => _fetchOrders(reset: true),
        child: _isLoading && _orders.isEmpty
            ? const Center(child: CircularProgressIndicator())
            : _orders.isEmpty
                ? _buildEmptyState()
                : ListView.builder(
                    itemCount: _orders.length + (_hasMore ? 1 : 0),
                    padding: const EdgeInsets.all(16),
                    itemBuilder: (context, index) {
                      if (index == _orders.length) {
                        _page++;
                        _fetchOrders();
                        return const Center(
                          child: Padding(
                            padding: EdgeInsets.all(8.0),
                            child: CircularProgressIndicator(strokeWidth: 2),
                          ),
                        );
                      }

                      final order = _orders[index];
                      final bool isActive = order['status'] != 'delivered' && order['status'] != 'failed';
                      final grandTotal = (order['grandTotal'] as num) / 100;
                      final dateStr = DateTime.parse(order['createdAt']).toLocal().toString().substring(0, 16);

                      return Card(
                        color: Colors.white,
                        elevation: 0,
                        margin: const EdgeInsets.only(bottom: 12),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                          side: const BorderSide(color: Color(0xFFE2E8F0)),
                        ),
                        child: InkWell(
                          borderRadius: BorderRadius.circular(12),
                          onTap: () {
                            context.push('/customer/track/${order['trackingToken']}');
                          },
                          child: Padding(
                            padding: const EdgeInsets.all(16.0),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    Text(
                                      'ID: ${order['id'].toString().substring(0, 8).toUpperCase()}',
                                      style: const TextStyle(fontWeight: FontWeight.bold, fontFamily: 'monospace'),
                                    ),
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                      decoration: BoxDecoration(
                                        color: _getStatusColor(order['status']).withOpacity(0.1),
                                        borderRadius: BorderRadius.circular(12),
                                      ),
                                      child: Text(
                                        _formatStatus(order['status']),
                                        style: TextStyle(
                                          fontSize: 10,
                                          fontWeight: FontWeight.bold,
                                          color: _getStatusColor(order['status']),
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                                const Divider(height: 24, color: Color(0xFFF1F5F9)),
                                Row(
                                  children: [
                                    const Icon(Icons.store_outlined, size: 16, color: Colors.grey),
                                    const SizedBox(width: 8),
                                    Expanded(
                                      child: Text(
                                        order['deliveryAddress'] ?? 'Delivery Address',
                                        style: const TextStyle(fontSize: 13, color: Color(0xFF475569)),
                                        maxLines: 1,
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 8),
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    Text(
                                      '₹${grandTotal.toStringAsFixed(2)} • ${order['paymentType'].toString().toUpperCase()}',
                                      style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                                    ),
                                    Text(
                                      dateStr,
                                      style: const TextStyle(fontSize: 11, color: Colors.grey),
                                    ),
                                  ],
                                ),
                                if (isActive) ...[
                                  const SizedBox(height: 12),
                                  SizedBox(
                                    width: double.infinity,
                                    child: ElevatedButton.icon(
                                      onPressed: () {
                                        context.push('/customer/track/${order['trackingToken']}');
                                      },
                                      icon: const Icon(Icons.location_searching, size: 16),
                                      label: const Text('Track Live Delivery', style: TextStyle(fontWeight: FontWeight.bold)),
                                      style: ElevatedButton.styleFrom(
                                        backgroundColor: const Color(0xFF2563EB),
                                        foregroundColor: Colors.white,
                                        elevation: 0,
                                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                                      ),
                                    ),
                                  ),
                                ],
                              ],
                            ),
                          ),
                        ),
                      );
                    },
                  ),
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.shopping_bag_outlined, size: 64, color: Colors.grey[300]),
          const SizedBox(height: 16),
          const Text(
            'No Orders Found',
            style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 8),
          const Text(
            'You haven\'t placed any orders yet.',
            style: TextStyle(fontSize: 13, color: Colors.grey),
          ),
          const SizedBox(height: 24),
          ElevatedButton(
            onPressed: () => context.go('/home'),
            style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF16A34A)),
            child: const Text('Start Shopping', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }
}

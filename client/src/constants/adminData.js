import { 
  DashboardIcon, 
  ProductIcon, 
  OrderIcon, 
  UserIcon, 
  SettingsIcon 
} from '../components/icons/AdminIcons'

// 카테고리 목록
export const CATEGORIES = [
  'BEST', '겨울신상', '패딩', 'MADE', '오늘의특가', 
  '아우터', '원피스', '니트', '티셔츠', '팬츠', '스커트', '악세서리'
]

// 메뉴 항목
export const MENU_ITEMS = [
  { id: 'dashboard', label: '대시보드', icon: DashboardIcon },
  { id: 'products', label: '상품 관리', icon: ProductIcon },
  { id: 'orders', label: '주문 관리', icon: OrderIcon },
  { id: 'users', label: '회원 관리', icon: UserIcon },
  { id: 'settings', label: '설정', icon: SettingsIcon },
]

// 페이지 타이틀 정보
export const PAGE_TITLES = {
  dashboard: { title: '대시보드', subtitle: '성찬몰 관리자 페이지에 오신 것을 환영합니다' },
  products: { title: '상품 관리', subtitle: '상품을 등록, 수정, 삭제할 수 있습니다' },
  orders: { title: '주문 관리', subtitle: '주문 현황을 확인하고 처리할 수 있습니다' },
  users: { title: '회원 관리', subtitle: '회원 정보를 조회하고 관리할 수 있습니다' },
  settings: { title: '설정', subtitle: '사이트 설정을 변경할 수 있습니다' },
}

// 대시보드 통계 데이터 (실제로는 API에서 가져와야 함)
export const MOCK_STATS = [
  { id: 1, label: '총 매출', value: '₩12,450,000', change: '+12.5%', trend: 'up', period: '지난 달 대비' },
  { id: 2, label: '주문 수', value: '324건', change: '+8.2%', trend: 'up', period: '지난 달 대비' },
  { id: 3, label: '신규 회원', value: '89명', change: '-3.1%', trend: 'down', period: '지난 달 대비' },
  { id: 4, label: '평균 주문액', value: '₩38,420', change: '+5.7%', trend: 'up', period: '지난 달 대비' },
]

// 최근 주문 데이터 (실제로는 API에서 가져와야 함)
export const MOCK_RECENT_ORDERS = [
  { id: 'ORD-2024001', customer: '김민지', product: '[덤핑리얼밍크] 야누스 무스탕', amount: '₩20,300', status: '배송중', date: '2024-12-15' },
  { id: 'ORD-2024002', customer: '이서연', product: '[도톰한겨울] 따스한 니트가디건', amount: '₩21,700', status: '결제완료', date: '2024-12-15' },
  { id: 'ORD-2024003', customer: '박지원', product: '[르플레르숄] 가디건 레이온', amount: '₩31,150', status: '배송완료', date: '2024-12-14' },
  { id: 'ORD-2024004', customer: '최유나', product: '[힐링맨투맨] 기모 반집업', amount: '₩42,230', status: '주문취소', date: '2024-12-14' },
  { id: 'ORD-2024005', customer: '정하늘', product: '[플랜베어리] 라쿤 캐시미어', amount: '₩37,450', status: '배송중', date: '2024-12-13' },
]

// 베스트 상품 데이터 (실제로는 API에서 가져와야 함)
export const MOCK_BEST_PRODUCTS = [
  { id: 1, name: '[덤핑리얼밍크] 야누스무스탕본딩', sales: 245, revenue: '₩4,973,500' },
  { id: 2, name: '[도톰한겨울] 따스한니트가디건', sales: 198, revenue: '₩4,296,600' },
  { id: 3, name: '[르플레르숄] 가디건 레이온', sales: 156, revenue: '₩4,859,400' },
  { id: 4, name: '[로얄프렌치] 플러피울코트', sales: 142, revenue: '₩2,932,300' },
  { id: 5, name: '[무드블랑] 트위드자켓', sales: 128, revenue: '₩2,388,480' },
]

// 가격 포맷팅 유틸
export const formatPrice = (price) => {
  return new Intl.NumberFormat('ko-KR').format(price)
}


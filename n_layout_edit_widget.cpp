#include "n_layout_edit_widget.h"
#include "n_util.h"
#include "ui_n_layout_edit_widget.h"

#include <QWebFrame>
#include <QDebug>
#include <QMenu>

NLayoutEditWidget::NLayoutEditWidget(QWidget *parent) : QWidget(parent), ui(new Ui::NLayoutEditWidget)
{
    ui->setupUi(this);

    QWebView *webView = ui->webView;
    QWebSettings *settings = webView->settings();
    QWebSettings::setObjectCacheCapacities(0, 0, 0);
    settings->setAttribute(QWebSettings::LocalContentCanAccessRemoteUrls, true);
    settings->setAttribute(QWebSettings::DeveloperExtrasEnabled, true);

    connect(ui->viewClassTreeWidget, SIGNAL(itemDoubleClicked(QTreeWidgetItem*,int)), this, SLOT(addViewToJS(QTreeWidgetItem*, int)));
    connect(ui->layerTreeWidget, SIGNAL(changedTreeByDrop()), this, SLOT(updateViewsToJS()));
    connect(ui->layerTreeWidget, SIGNAL(itemSelectionChanged()), this, SLOT(selectViewToJS()));
    connect(ui->layerTreeWidget, SIGNAL(customContextMenuRequested(QPoint)), this, SLOT(contextMenuForViewsTree(QPoint)));
}

void NLayoutEditWidget::setNativeBridge(NativeBridge *native) {
    mNative = native;
    QWebView *webView = ui->webView;
    connect(webView->page()->mainFrame(), SIGNAL(javaScriptWindowObjectCleared()), this, SLOT(injectNativeBridge()));
    injectNativeBridge();

    ui->layoutPropEdit->setNativeBridge(native);

    connect(native, SIGNAL(viewsFromJS(QList<QMap<QString,QString> >)), this, SLOT(setViewsFromJS(QList<QMap<QString,QString> >)));
    connect(native, SIGNAL(currentViewFromJS(NJson)), this, SLOT(setCurrentViewFromJS(NJson)));
}

void NLayoutEditWidget::loadFile(QString filePath) {
    QWebView *webView = ui->webView;
    QString htmlPath = "file://" + filePath;
    webView->load(QUrl(htmlPath));
}

QString NLayoutEditWidget::contentLayoutJsonText() const {
    QWebFrame *frame = ui->webView->page()->mainFrame();
    QVariant variant = frame->evaluateJavaScript("window.getContentLayout();");
    return variant.toString();
}

void NLayoutEditWidget::injectNativeBridge (){
    QWebView *webView = ui->webView;
    webView->page()->mainFrame()->addToJavaScriptWindowObject(QString("Native"), mNative);
}

void NLayoutEditWidget::contextMenuForViewsTree(const QPoint &point) {
    QMenu menu(this);

    menu.addAction(tr("&Delete"), this, SLOT(deleteViewToJS()));

    // 選択されたところに行があるときしかメニューを表示しない
    QModelIndex index = ui->layerTreeWidget->indexAt(point);
    if (index.isValid()) {
        menu.exec(QCursor::pos());
    } else {
        ui->layerTreeWidget->clearSelection();
    }
}

/*******************************************
 * from js method
 *******************************************/
void NLayoutEditWidget::setViewsFromJS(const QList<QMap<QString, QString> > &views) {
    QTreeWidget *layerTreeWidget = ui->layerTreeWidget;
    layerTreeWidget->clear();
    for (int i = 0; i < views.length(); i++) {
        QStringList row;
        NUtil::expand(row, 2);
        row[ViewsColId] = views[i]["id"];
        row[ViewsColClass] = views[i]["class"];

        QTreeWidgetItem *item = new QTreeWidgetItem(row);
        item->setFlags(Qt::ItemIsDragEnabled | Qt::ItemIsEnabled | Qt::ItemIsSelectable | Qt::ItemNeverHasChildren);

        layerTreeWidget->addTopLevelItem(item);
    }
}

void NLayoutEditWidget::setCurrentViewFromJS(const NJson &json) {
    QString viewId = json.getStr("id");

    QTreeWidget *tree = ui->layerTreeWidget;
    for (int i = 0; i < tree->topLevelItemCount(); i++) {
        QTreeWidgetItem *item = tree->topLevelItem(i);
        QString _viewId = item->text(ViewsColId);
        if (_viewId == viewId) {
            tree->setCurrentItem(item);
            return;
        }
    }
}

/*************************************************
 * to js method
 *************************************************/
void NLayoutEditWidget::updateViewsToJS() {
    NTreeWidget *tree = ui->layerTreeWidget;
    int layerNum = tree->topLevelItemCount();
    QStringList viewIds;
    for (int i = 0; i < layerNum; i++) {
        viewIds.append(tree->topLevelItem(i)->text(ViewsColId));
    }
    emit mNative->changedViewsOrderToJS(viewIds);
}

void NLayoutEditWidget::selectViewToJS() {
    NTreeWidget *tree = ui->layerTreeWidget;

    QTreeWidgetItem *item = tree->currentItem();

    // viewの削除によって、countは1なのにitemはnullの場合がある
    if (item == NULL) {
       return;
    }

    QString viewId = item->text(ViewsColId);
    emit mNative->changedSelectedViewToJS(viewId);
}

void NLayoutEditWidget::addViewToJS(QTreeWidgetItem *item, int /* index */) {
    QTreeWidget *tree = ui->layerTreeWidget;
    QString viewId = item->text(ViewClassColName) + QString::number(tree->topLevelItemCount() + 1);
    QString viewClass = item->text(ViewClassColClass);

    QStringList row;
    NUtil::expand(row, 2);
    row[ViewsColId] = viewId;
    row[ViewsColClass] = viewClass;
    QTreeWidgetItem *viewsItem = new QTreeWidgetItem(row);
    tree->addTopLevelItem(viewsItem);

    emit mNative->addViewToJS(viewId, viewClass);
}

void NLayoutEditWidget::deleteViewToJS() {
    // delete item from tree;
    QTreeWidgetItem *item = ui->layerTreeWidget->currentItem();
    int index = ui->layerTreeWidget->indexOfTopLevelItem(item);
    ui->layerTreeWidget->takeTopLevelItem(index);

    QString viewId = item->text(ViewsColId);
    emit mNative->deleteViewToJS(viewId);
}

NLayoutEditWidget::~NLayoutEditWidget()
{
    delete ui;
}

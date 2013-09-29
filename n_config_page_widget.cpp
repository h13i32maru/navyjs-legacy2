#include "edit_json_dialog.h"
#include "n_config_page_widget.h"
#include "n_util.h"
#include "ui_n_config_page_widget.h"

#include <QMenu>
#include <QMessageBox>

NConfigPageWidget::NConfigPageWidget(const QDir &projectDir, const QString &filePath, QWidget *parent) : NFileWidget(projectDir, filePath, parent), ui(new Ui::NConfigPageWidget)
{
    ui->setupUi(this);

    mConfigPage.parseFromFilePath(filePath);

    syncJsonToWidget();

    connect(ui->pageConfigTreeWidget, SIGNAL(customContextMenuRequested(QPoint)), this, SLOT(contextMenu(QPoint)));
}

bool NConfigPageWidget::save() {
    syncWidgetToJson();

    QFile configPageFile(mFilePath);
    if (!configPageFile.open(QIODevice::WriteOnly | QIODevice::Text)) {
        return false;
    }
    int ret = configPageFile.write(this->mConfigPage.stringify());

    return (ret == -1 ? false: true);
}
void NConfigPageWidget::newPage() {
    int count = ui->pageConfigTreeWidget->topLevelItemCount();
    QString suffix = QString::number(count);
    QStringList row;
    NUtil::expand(row, ui->pageConfigTreeWidget->columnCount());
    row[PAGE_COL_ID] = "Page" + suffix;
    row[PAGE_COL_CLASS] = "Page" + suffix;
    row[PAGE_COL_CLASS_FILE] = "code/page" + suffix + ".js";
    row[PAGE_COL_LAYOUT] = "layout/page" + suffix + ".json";
    QTreeWidgetItem *item = new QTreeWidgetItem(row);
    item->setFlags(item->flags() | Qt::ItemIsEditable);
    ui->pageConfigTreeWidget->insertTopLevelItem(count, item);
}

void NConfigPageWidget::removePage() {
    QList<QTreeWidgetItem *> selectedItems = ui->pageConfigTreeWidget->selectedItems();
    if (selectedItems.length() == 0) {
        return;
    }

    QTreeWidgetItem *item = selectedItems[0];

    QMessageBox msgBox;
    msgBox.setText(tr("Do you remove page?"));
    msgBox.setInformativeText(item->text(PAGE_COL_ID));
    msgBox.setStandardButtons(QMessageBox::Ok | QMessageBox::Cancel);
    msgBox.setDefaultButton(QMessageBox::Cancel);
    int ret = msgBox.exec();
    if (ret == QMessageBox::Ok) {
        ui->pageConfigTreeWidget->takeTopLevelItem(ui->pageConfigTreeWidget->indexOfTopLevelItem(item));
    }
}


void NConfigPageWidget::contextMenu(QPoint /*point*/) {
    QMenu menu(this);
    menu.addAction(tr("&New Page"), this, SLOT(newPage()));
    menu.addAction(tr("&Remove Page"), this, SLOT(removePage()));
    menu.addSeparator();
    menu.addAction(tr("&Edit Raw Data"), this, SLOT(showRawData()));
    menu.exec(QCursor::pos());
}

void NConfigPageWidget::syncJsonToWidget() {
    QList<QTreeWidgetItem *> items;
    for (int i = 0; i < mConfigPage.length(); i++) {
        NJson page = mConfigPage.getObject(QString::number(i));
        QStringList row;
        NUtil::expand(row, ui->pageConfigTreeWidget->columnCount());
        row[PAGE_COL_ID] = page.getStr("id");
        row[PAGE_COL_CLASS] = page.getStr("class");
        row[PAGE_COL_CLASS_FILE] = page.getStr("classFile");
        row[PAGE_COL_LAYOUT] = page.getStr("extra.contentLayoutFile");
        row[PAGE_COL_BGCOLOR] = page.getStr("backgroundColor");
        QTreeWidgetItem *item = new QTreeWidgetItem(row);
        item->setFlags(item->flags() | Qt::ItemIsEditable);
        items.append(item);
    }
    ui->pageConfigTreeWidget->clear();
    ui->pageConfigTreeWidget->addTopLevelItems(items);
}

void NConfigPageWidget::syncWidgetToJson() {
    mConfigPage.clear();
    for (int i = 0; i < ui->pageConfigTreeWidget->topLevelItemCount(); i++) {
        QTreeWidgetItem *item = ui->pageConfigTreeWidget->topLevelItem(i);
        QString index = QString::number(i);
        mConfigPage.set(index + ".id", item->text(PAGE_COL_ID));
        mConfigPage.set(index + ".class", item->text(PAGE_COL_CLASS));
        mConfigPage.set(index + ".classFile", item->text(PAGE_COL_CLASS_FILE));
        mConfigPage.set(index + ".extra.contentLayoutFile", item->text(PAGE_COL_LAYOUT));
        mConfigPage.set(index + ".backgroundColor", item->text(PAGE_COL_BGCOLOR));
    }
}

void NConfigPageWidget::showRawData() {
    EditJsonDialog dialog(this);
    this->syncWidgetToJson();
    dialog.setJsonText(mConfigPage.stringify());
    dialog.exec();
}


NConfigPageWidget::~NConfigPageWidget()
{
    delete ui;
}
